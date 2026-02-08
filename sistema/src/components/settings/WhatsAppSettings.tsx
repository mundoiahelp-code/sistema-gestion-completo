'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, RefreshCw, LogOut, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useTranslation } from '@/i18n/I18nProvider';

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export default function WhatsAppSettings() {
  const { t } = useTranslation();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reconnecting, setReconnecting] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    checkStatus();
    // Verificar cada 3 segundos normalmente
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Verificar más frecuentemente cuando el dialog del QR está abierto
  useEffect(() => {
    if (showQRDialog && qrCode) {
      // Verificar cada 1 segundo cuando el QR está visible
      const fastInterval = setInterval(checkStatus, 1000);
      return () => clearInterval(fastInterval);
    }
  }, [showQRDialog, qrCode]);

  const checkStatus = async () => {
    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/whatsapp/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const isConnected = response.data.connected;
      
      // Detectar cuando se conecta exitosamente (cambio de false a true)
      if (isConnected && !connected && showQRDialog) {
        // WhatsApp conectado - mostrando animación
        setShowSuccessAnimation(true);
        
        // Después de 2 segundos, cerrar el dialog
        setTimeout(() => {
          setShowQRDialog(false);
          setShowSuccessAnimation(false);
          setSuccess(t('settings.whatsappSettings.connectedSuccess'));
        }, 2000);
      }
      
      setConnected(isConnected);
      setLoading(false);
    } catch (error) {
      // Error silencioso en producción
      setLoading(false);
    }
  };

  const getQRCode = async () => {
    setError('');
    setSuccess('');
    setShowSuccessAnimation(false);
    
    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      
      // Primero verificar el estado actual
      const statusResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/whatsapp/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (statusResponse.data.connected) {
        setConnected(true);
        setSuccess(t('settings.whatsappSettings.alreadyConnected'));
        return;
      }
      
      // Abrir dialog con loading
      setShowQRDialog(true);
      setQrCode(null);
      
      // Si no está conectado, inicializar y obtener QR
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/whatsapp/reconnect`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Intentar obtener el QR varias veces
      let attempts = 0;
      const maxAttempts = 20; // Aumentado a 20 intentos
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 segundos entre intentos
        
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/whatsapp/qr`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Intento', attempts + 1, '- Respuesta:', response.data);

        if (response.data.qrCode) {
          // Convertir QR string a imagen base64 con opciones de compresión
          const QRCode = (await import('qrcode')).default;
          try {
            const qrDataUrl = await QRCode.toDataURL(response.data.qrCode, {
              errorCorrectionLevel: 'L', // Nivel bajo de corrección
              type: 'image/png',
              quality: 0.3,
              margin: 1,
              width: 256,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            });
            setQrCode(qrDataUrl);
            setError('');
            return;
          } catch (qrError: any) {
            console.error('Error generando QR:', qrError);
            setShowQRDialog(false);
            setError('Error al generar el código QR. Por favor, intentá de nuevo.');
            return;
          }
        }
        
        if (response.data.connected) {
          setConnected(true);
          setShowQRDialog(false);
          setSuccess(t('settings.whatsappSettings.alreadyConnected'));
          return;
        }
        
        attempts++;
      }
      
      setShowQRDialog(false);
      setError(t('settings.whatsappSettings.qrGenerateError'));
    } catch (error: any) {
      console.error('Error obteniendo QR:', error);
      setShowQRDialog(false);
      const errorMsg = error.response?.data?.message || error.message || t('settings.whatsappSettings.qrError');
      setError(errorMsg);
    }
  };

  const handleReconnect = async () => {
    setReconnecting(true);
    setError('');
    setSuccess('');

    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/whatsapp/reconnect`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(t('settings.whatsappSettings.reconnecting'));
      
      // Esperar un poco y luego obtener el QR
      setTimeout(() => {
        getQRCode();
      }, 2000);
    } catch (error) {
      setError(t('settings.whatsappSettings.reconnectError'));
    } finally {
      setReconnecting(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/whatsapp/logout`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConnected(false);
      setQrCode(null);
      setSuccess(t('settings.whatsappSettings.logoutSuccess'));
      setShowLogoutConfirm(false);
    } catch (error) {
      setError(t('settings.whatsappSettings.logoutError'));
      setShowLogoutConfirm(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WhatsAppIcon />
            WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WhatsAppIcon />
            {t('settings.whatsappSettings.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.whatsappSettings.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado de conexión */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
            <div className="flex items-center gap-3">
              {connected ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium dark:text-zinc-100">{t('settings.whatsappSettings.connected')}</p>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">{t('settings.whatsappSettings.whatsappActive')}</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium dark:text-zinc-100">{t('settings.whatsappSettings.notConnected')}</p>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">{t('settings.whatsappSettings.scanQRToConnect')}</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {connected ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleReconnect} disabled={reconnecting}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${reconnecting ? 'animate-spin' : ''}`} />
                    {t('settings.whatsappSettings.reconnect')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowLogoutConfirm(true)}>
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('settings.whatsappSettings.logout')}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={getQRCode}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  {t('settings.whatsappSettings.getQRCode')}
                </Button>
              )}
            </div>
          </div>

          {/* Mensajes de error/éxito */}
          {error && (
            <Alert variant="destructive" className="border-red-500 bg-red-50">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <AlertDescription className="text-red-800 font-medium">
                    {error}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-500 bg-green-50">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <AlertDescription className="text-green-800 font-medium">
                    {success}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* Info adicional */}
          {connected ? (
            <div className="p-4 bg-green-50 rounded-lg text-sm">
              <p className="text-green-700">
                ✓ {t('settings.whatsappSettings.connectedInfo')}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 rounded-lg text-sm">
              <p className="text-blue-700">
                {t('settings.whatsappSettings.connectInfo')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog del QR Code */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WhatsAppIcon />
              {t('settings.whatsappSettings.scanQRTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode ? (
              <>
                <div className="relative flex justify-center p-4 bg-white dark:bg-zinc-800 rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="QR Code" width={300} height={300} className="rounded" />
                  
                  {/* Animación de éxito */}
                  {showSuccessAnimation && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-zinc-800/90 rounded-lg animate-in fade-in zoom-in duration-300">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                          <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                        <p className="text-lg font-semibold text-green-700">{t('settings.whatsappSettings.connected')}!</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <p className="font-medium">{t('settings.whatsappSettings.stepsToConnect')}</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>{t('settings.whatsappSettings.step1')}</li>
                    <li>{t('settings.whatsappSettings.step2')}</li>
                    <li>{t('settings.whatsappSettings.step3')}</li>
                    <li>{t('settings.whatsappSettings.step4')}</li>
                  </ol>
                </div>
                <Alert>
                  <AlertDescription className="text-xs">
                    {t('settings.whatsappSettings.qrAutoUpdate')}
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mb-4" />
                <p className="text-sm text-gray-500">{t('settings.whatsappSettings.generatingQR')}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de logout */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
              <LogOut className="w-5 h-5" />
              Cerrar sesión de WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              ¿Estás seguro que querés cerrar la sesión de WhatsApp? Tendrás que escanear el código QR nuevamente para reconectar.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
