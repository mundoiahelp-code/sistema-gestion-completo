'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScanLine, Keyboard } from 'lucide-react';

interface ImeiScannerProps {
  onScan: (imei: string) => void;
  className?: string;
}

export default function ImeiScanner({
  onScan,
  className = '',
}: ImeiScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualImei, setManualImei] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    if (!containerRef.current) return;

    try {
      setError(null);
      const scanner = new Html5Qrcode('scanner-container', {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
        verbose: true, // Activar logs para debug
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10, // FPS más bajo para mejor precisión
          qrbox: function(viewfinderWidth, viewfinderHeight) {
            // Cuadro adaptativo para códigos de barras horizontales
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * 0.8);
            return {
              width: qrboxSize,
              height: Math.floor(qrboxSize * 0.4) // Más ancho que alto para códigos de barras
            };
          },
          aspectRatio: 2.5,
          disableFlip: false, // Permitir flip de imagen
        },
        (decodedText) => {
          // Limpiar el texto y extraer solo números
          const cleanText = decodedText.replace(/\D/g, '');
          console.log('📱 Escaneado:', decodedText);
          console.log('🔢 Limpio:', cleanText);
          console.log('📏 Longitud:', cleanText.length);
          
          // Validar que sea un IMEI (15 dígitos) o aceptar si tiene entre 13-16
          if (cleanText.length >= 13 && cleanText.length <= 16) {
            const imei = cleanText.slice(0, 15); // Tomar los primeros 15
            console.log('✅ IMEI detectado:', imei);
            onScan(imei);
            
            // También disparar evento global para que lo escuchen otros componentes
            window.dispatchEvent(new CustomEvent('imei-scanned', { 
              detail: { imei } 
            }));
            
            stopScanner();
            setIsOpen(false);
          } else {
            console.log('⚠️ Longitud incorrecta, esperando más dígitos...');
          }
        },
        (errorMessage) => {
          // Silenciar errores de escaneo continuo
          if (!errorMessage.includes('NotFoundException')) {
            console.log('Scanner error:', errorMessage);
          }
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      if (err.message?.includes('Permission denied')) {
        setError('Permiso de cámara denegado. Habilitalo en la configuración del navegador.');
      } else if (err.message?.includes('NotFoundError')) {
        setError('No se encontró cámara. Usá un scanner físico o una app.');
      } else {
        setError('Error al iniciar la cámara. Probá con un scanner físico.');
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Pequeño delay para que el DOM se renderice
      setTimeout(startScanner, 100);
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors ${className}`}
        title="Escanear IMEI"
      >
        <ScanLine className="h-5 w-5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="h-5 w-5" />
              Escanear IMEI
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!manualMode ? (
              <>
                {/* Área del scanner */}
                <div
                  id="scanner-container"
                  ref={containerRef}
                  className="w-full h-64 bg-black rounded-lg overflow-hidden"
                />

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Instrucciones */}
                <div className="text-center text-sm space-y-3">
                  {isScanning ? (
                    <>
                      <p className="text-green-500 font-semibold animate-pulse">
                        📷 Cámara activa
                      </p>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-xs space-y-1">
                        <p className="font-semibold text-blue-700 dark:text-blue-300">💡 Tips para escanear:</p>
                        <p className="text-blue-600 dark:text-blue-400">• Mantené el código horizontal</p>
                        <p className="text-blue-600 dark:text-blue-400">• Acercá/alejá hasta que esté enfocado</p>
                        <p className="text-blue-600 dark:text-blue-400">• Asegurate que haya buena luz</p>
                        <p className="text-blue-600 dark:text-blue-400">• El código debe estar dentro del cuadro</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-zinc-500">Apuntá la cámara al código de barras del IMEI</p>
                      <p className="text-xs text-zinc-400">El IMEI está en la caja o en Ajustes → General → Información</p>
                    </>
                  )}
                </div>

                {/* Botón para modo manual */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    stopScanner();
                    setManualMode(true);
                  }}
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Escribir IMEI manualmente
                </Button>
              </>
            ) : (
              <>
                {/* Modo manual */}
                <div className="space-y-3">
                  <p className="text-sm text-zinc-500">Escribí el IMEI (15 dígitos):</p>
                  <Input
                    type="text"
                    placeholder="Ej: 123456789012345"
                    value={manualImei}
                    onChange={(e) => setManualImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    className="text-center text-lg tracking-wider"
                    autoFocus
                  />
                  <p className="text-xs text-zinc-400 text-center">
                    {manualImei.length}/15 dígitos
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setManualMode(false);
                      setManualImei('');
                      setTimeout(startScanner, 100);
                    }}
                  >
                    Volver a cámara
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={manualImei.length !== 15}
                    onClick={() => {
                      if (manualImei.length === 15) {
                        console.log('✅ IMEI manual:', manualImei);
                        onScan(manualImei);
                        
                        // También disparar evento global
                        window.dispatchEvent(new CustomEvent('imei-scanned', { 
                          detail: { imei: manualImei } 
                        }));
                        
                        setIsOpen(false);
                        setManualImei('');
                        setManualMode(false);
                      }
                    }}
                  >
                    Confirmar
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
