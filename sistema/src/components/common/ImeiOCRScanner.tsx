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

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('No se pudo acceder a la cámara. Verificá los permisos.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
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

    try {
      // Procesar con OCR
      const result = await Tesseract.recognize(
        canvas,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setDetectedText(`Leyendo texto... ${Math.round(m.progress * 100)}%`);
            }
          }
        }
      );

      const text = result.data.text;
      console.log('📝 Texto detectado:', text);

      // Buscar secuencias de 15 dígitos (IMEI)
      const imeiPattern = /\b\d{15}\b/g;
      const matches = text.match(imeiPattern);

      if (matches && matches.length > 0) {
        const imei = matches[0];
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
        setDetectedText('❌ No se detectó un IMEI válido. Intentá de nuevo.');
        setTimeout(() => setDetectedText(''), 2000);
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
                <div className="border-2 border-green-500 border-dashed rounded-lg w-4/5 h-24 flex items-center justify-center">
                  <span className="text-green-500 text-xs bg-black/50 px-2 py-1 rounded">
                    Centrá el número del IMEI aquí
                  </span>
                </div>
              </div>
            </div>

            {/* Canvas oculto para captura */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Estado */}
            {detectedText && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {detectedText}
                </p>
              </div>
            )}

            {/* Instrucciones */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-yellow-700 dark:text-yellow-300">
                📸 Instrucciones:
              </p>
              <p className="text-yellow-600 dark:text-yellow-400">
                1. Centrá el número del IMEI en el cuadro verde<br/>
                2. Mantené el celular quieto y enfocado<br/>
                3. Asegurate que haya buena luz<br/>
                4. Click en "Capturar y leer"
              </p>
            </div>

            {/* Botón de captura */}
            <Button
              onClick={captureAndProcess}
              disabled={isProcessing || !stream}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Capturar y leer IMEI
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
