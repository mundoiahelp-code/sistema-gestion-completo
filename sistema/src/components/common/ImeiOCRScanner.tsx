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
import { Camera, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [lastScannedImei, setLastScannedImei] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Tesseract.Worker | null>(null);

  // Inicializar worker de Tesseract una sola vez
  useEffect(() => {
    const initWorker = async () => {
      const worker = await Tesseract.createWorker('eng', 1, {
        logger: () => {},
      });
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
      });
      workerRef.current = worker;
    };
    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

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
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('No se pudo acceder a la cámara');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const processFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !workerRef.current || isProcessing) return;

    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      // Capturar frame
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      // Convertir a escala de grises y aumentar contraste
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const value = avg > 128 ? 255 : 0; // Binarizar
        data[i] = data[i + 1] = data[i + 2] = value;
      }
      
      context.putImageData(imageData, 0, 0);

      // Reconocer texto
      const result = await workerRef.current.recognize(canvas);
      const text = result.data.text.replace(/\s/g, '');
      
      console.log('Texto detectado:', text);

      // Buscar IMEI (15 dígitos consecutivos)
      const imeiMatch = text.match(/\d{15}/);
      
      if (imeiMatch) {
        const imei = imeiMatch[0];
        
        // Evitar duplicados
        if (imei !== lastScannedImei) {
          console.log('✅ IMEI encontrado:', imei);
          setLastScannedImei(imei);
          toast.success(`IMEI detectado: ${imei}`);
          
          setTimeout(() => {
            onScan(imei);
            stopCamera();
            setIsOpen(false);
            setLastScannedImei('');
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error en OCR:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
      // Escanear cada 1.5 segundos
      const interval = setInterval(processFrame, 1500);
      return () => {
        clearInterval(interval);
        stopCamera();
      };
    }
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors ${className}`}
        title="Escanear IMEI"
      >
        <Camera className="h-5 w-5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Escanear IMEI
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
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
              
              {/* Overlay de escaneo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-4 border-green-500 rounded-lg w-4/5 h-3/4 animate-pulse" />
              </div>

              {/* Indicador de procesamiento */}
              {isProcessing && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Leyendo...
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {/* Instrucciones */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
              <p className="font-semibold text-blue-700 dark:text-blue-300 text-sm">
                📸 Instrucciones:
              </p>
              <ul className="text-blue-600 dark:text-blue-400 text-xs space-y-1">
                <li>• Enfocá la etiqueta completa en el cuadro verde</li>
                <li>• Mantené el celular quieto 2-3 segundos</li>
                <li>• Asegurate que haya buena luz</li>
                <li>• El sistema detectará el IMEI automáticamente</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
