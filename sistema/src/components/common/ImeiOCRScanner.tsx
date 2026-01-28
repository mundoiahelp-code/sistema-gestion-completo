'use client';

import { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScanLine, Camera, Loader2, CheckCircle } from 'lucide-react';

interface ImeiOCRScannerProps {
  onScan: (imei: string) => void;
  className?: string;
}

export default function ImeiOCRScanner({
  onScan,
  className = '',
}: ImeiOCRScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedText, setDetectedText] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Esperar a que el video esté listo y empezar a escanear
        videoRef.current.onloadedmetadata = () => {
          startContinuousScanning();
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setDetectedText('❌ No se pudo acceder a la cámara');
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const startContinuousScanning = () => {
    setIsScanning(true);
    setDetectedText('🔍 Buscando IMEI...');
    
    // Escanear cada 2 segundos
    scanIntervalRef.current = setInterval(() => {
      if (!isProcessing) {
        captureAndProcess();
      }
    }, 2000);
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    setDetectedText('Procesando imagen...');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Capturar frame del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    // Mejorar contraste y brillo para mejor OCR
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Aumentar contraste
    const contrast = 1.5;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    
    for (let i = 0; i < data.length; i += 4) {
      data[i] = factor * (data[i] - 128) + 128;     // R
      data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
      data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
    }
    
    context.putImageData(imageData, 0, 0);

    try {
      // Procesar con OCR - configuración optimizada para velocidad
      const result = await Tesseract.recognize(
        canvas,
        'eng',
        {
          logger: () => {}, // Sin logs para más velocidad
          tessedit_char_whitelist: '0123456789 ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        }
      );

      const text = result.data.text;
      console.log('📝 Texto completo detectado:', text);

      // Limpiar el texto: quitar espacios, guiones, puntos
      const cleanText = text.replace(/[\s\-\.]/g, '');
      console.log('🧹 Texto limpio:', cleanText);

      // Buscar TODAS las secuencias de dígitos (no solo 15)
      const allNumbers = cleanText.match(/\d+/g) || [];
      console.log('🔢 Números encontrados:', allNumbers);

      // Buscar secuencias de exactamente 15 dígitos
      let imei = null;
      
      // Primero buscar 15 dígitos exactos
      for (const num of allNumbers) {
        if (num.length === 15) {
          imei = num;
          break;
        }
      }

      // Si no encuentra 15 exactos, buscar en el texto completo sin espacios
      if (!imei) {
        const imeiPattern = /\d{15}/g;
        const matches = cleanText.match(imeiPattern);
        if (matches && matches.length > 0) {
          imei = matches[0];
        }
      }

      // Si aún no encuentra, buscar números largos y tomar los primeros 15 dígitos
      if (!imei) {
        for (const num of allNumbers) {
          if (num.length >= 15) {
            imei = num.slice(0, 15);
            break;
          }
        }
      }

      if (imei) {
        console.log('✅ IMEI encontrado:', imei);
        setDetectedText(`✅ IMEI detectado: ${imei}`);
        
        // Esperar 1 segundo para que el usuario vea el resultado
        setTimeout(() => {
          onScan(imei);
          stopCamera();
          setIsOpen(false);
          setDetectedText('');
        }, 1000);
      } else {
        console.log('❌ No se encontró IMEI. Números detectados:', allNumbers);
        setDetectedText('❌ No se detectó un IMEI de 15 dígitos. Intentá de nuevo con mejor luz.');
        setTimeout(() => setDetectedText(''), 3000);
      }
    } catch (error) {
      console.error('Error en OCR:', error);
      setDetectedText('❌ Error al procesar. Intentá de nuevo.');
      setTimeout(() => setDetectedText(''), 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors ${className}`}
        title="Escanear IMEI con OCR"
      >
        <Camera className="h-5 w-5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Escanear número de IMEI
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Video preview */}
            <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Guía visual */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-green-500 border-dashed rounded-lg w-4/5 h-3/4 flex items-center justify-center">
                  <span className="text-green-500 text-xs bg-black/50 px-2 py-1 rounded">
                    Enfocá toda la etiqueta aquí
                  </span>
                </div>
              </div>
            </div>

            {/* Canvas oculto para captura */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Estado */}
            {detectedText && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {detectedText}
                </p>
              </div>
            )}

            {/* Instrucciones */}
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-green-700 dark:text-green-300">
                ⚡ Escaneo automático activado
              </p>
              <p className="text-green-600 dark:text-green-400">
                • Enfocá toda la etiqueta en el cuadro<br/>
                • Mantené el celular quieto<br/>
                • El sistema detectará el IMEI automáticamente<br/>
                • Asegurate que haya buena luz
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
