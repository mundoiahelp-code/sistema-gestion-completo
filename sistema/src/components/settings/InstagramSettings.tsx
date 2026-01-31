'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Instagram, CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useTranslation } from '@/i18n/I18nProvider';

export default function InstagramSettings() {
  const { t } = useTranslation();
  
  // MODO MANTENIMIENTO - Desactivar temporalmente
  const MAINTENANCE_MODE = true;

  if (MAINTENANCE_MODE) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="w-5 h-5" />
            Instagram Direct Messages
          </CardTitle>
          <CardDescription>
            Conecta tu cuenta de Instagram Business para recibir y responder mensajes desde el CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
            <div className="flex items-start gap-3">
              <Loader2 className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold mb-2">🚧 Integración en Mantenimiento</p>
                  <p className="text-sm">
                    La integración con Instagram está temporalmente deshabilitada mientras configuramos los permisos necesarios con Meta/Facebook.
                  </p>
                  <p className="text-sm mt-2">
                    Mientras tanto, podés usar WhatsApp para gestionar tus conversaciones.
                  </p>
                </AlertDescription>
              </div>
            </div>
          </Alert>

          <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-zinc-400">
              <strong>¿Por qué está en mantenimiento?</strong>
            </p>
            <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
              La API de Instagram requiere una configuración compleja con Facebook Developers y aprobación de permisos por parte de Meta. Estamos trabajando en simplificar este proceso.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Facebook App Config - DEBES CREAR UNA APP EN developers.facebook.com
  const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || ''; // Configurar en .env
  const REDIRECT_URI = `${window.location.origin}/api/instagram/callback`;

  useEffect(() => {
    checkStatus();
    
    // Verificar si venimos del callback de OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const errorParam = urlParams.get('error');
    
    if (code) {
      handleOAuthCallback(code);
    } else if (errorParam) {
      setError('Error al conectar con Instagram: ' + errorParam);
    }
  }, []);

  const checkStatus = async () => {
    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/instagram/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setConnected(response.data.connected);
      setUsername(response.data.username || '');
    } catch (error) {
      console.error('Error checking Instagram status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWithOAuth = () => {
    if (!FACEBOOK_APP_ID) {
      setError('Facebook App ID no configurado. Contacta al administrador.');
      return;
    }

    setConnecting(true);
    
    // Permisos necesarios para Instagram
    const permissions = [
      'pages_show_list',
      'pages_messaging',
      'instagram_basic',
      'instagram_manage_messages',
      'pages_manage_metadata'
    ].join(',');

    // URL de OAuth de Facebook
    const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${FACEBOOK_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=${permissions}` +
      `&response_type=code` +
      `&state=${Math.random().toString(36).substring(7)}`;

    // Abrir ventana de OAuth
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      oauthUrl,
      'Instagram OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Escuchar el mensaje del callback
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'instagram-oauth-success') {
        popup?.close();
        setSuccess('¡Instagram conectado exitosamente!');
        checkStatus();
        setConnecting(false);
      } else if (event.data.type === 'instagram-oauth-error') {
        popup?.close();
        setError(event.data.error || 'Error al conectar Instagram');
        setConnecting(false);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Limpiar listener cuando se cierre el popup
    const checkPopup = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkPopup);
        window.removeEventListener('message', handleMessage);
        setConnecting(false);
      }
    }, 500);
  };

  const handleOAuthCallback = async (code: string) => {
    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/instagram/oauth-callback`,
        { code, redirectUri: REDIRECT_URI },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Notificar a la ventana padre
        if (window.opener) {
          window.opener.postMessage({ type: 'instagram-oauth-success' }, window.location.origin);
          window.close();
        } else {
          setSuccess('¡Instagram conectado exitosamente!');
          checkStatus();
          // Limpiar URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Error al conectar Instagram';
      if (window.opener) {
        window.opener.postMessage({ type: 'instagram-oauth-error', error: errorMsg }, window.location.origin);
        window.close();
      } else {
        setError(errorMsg);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de desconectar Instagram?')) return;

    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/instagram/disconnect`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConnected(false);
      setUsername('');
      setSuccess('Instagram desconectado correctamente');
    } catch (error) {
      setError('Error al desconectar Instagram');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="w-5 h-5" />
            Instagram Direct Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <p className="text-sm text-gray-500">Cargando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Instagram className="w-5 h-5" />
          Instagram Direct Messages
        </CardTitle>
        <CardDescription>
          Conecta tu cuenta de Instagram Business para recibir y responder mensajes desde el CRM
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
                  <p className="font-medium dark:text-zinc-100">Instagram Conectado</p>
                  {username && <p className="text-sm text-gray-500 dark:text-zinc-400">@{username}</p>}
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium dark:text-zinc-100">Instagram No Conectado</p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">Conecta tu cuenta para empezar</p>
                </div>
              </>
            )}
          </div>
          {connected && (
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              Desconectar
            </Button>
          )}
        </div>

        {/* Mensajes de error/éxito */}
        {error && (
          <Alert variant="destructive" className="border-red-500 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <AlertDescription className="text-red-800 dark:text-red-200 font-medium">
                  {error}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}
        {success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <AlertDescription className="text-green-800 dark:text-green-200 font-medium">
                  {success}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Botón de conexión */}
        {!connected && (
          <div className="space-y-4">
            <Button
              onClick={handleConnectWithOAuth}
              disabled={connecting || !FACEBOOK_APP_ID}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <Instagram className="w-4 h-4 mr-2" />
                  Conectar con Instagram
                </>
              )}
            </Button>

            {!FACEBOOK_APP_ID && (
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Configuración requerida:</strong> El administrador debe configurar FACEBOOK_APP_ID en las variables de entorno.
                </AlertDescription>
              </Alert>
            )}

            {/* Información */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm space-y-2">
              <p className="font-medium flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <ExternalLink className="w-4 h-4" />
                ¿Cómo funciona?
              </p>
              <ul className="space-y-1 text-blue-800 dark:text-blue-200 list-disc list-inside">
                <li>Haz clic en "Conectar con Instagram"</li>
                <li>Inicia sesión con tu cuenta de Facebook</li>
                <li>Selecciona la página de Facebook vinculada a tu Instagram Business</li>
                <li>Autoriza los permisos necesarios</li>
                <li>¡Listo! Los mensajes aparecerán en el CRM</li>
              </ul>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                <strong>Nota:</strong> Necesitas una cuenta de Instagram Business vinculada a una página de Facebook.
              </p>
            </div>
          </div>
        )}

        {/* Info adicional cuando está conectado */}
        {connected && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
            <p className="text-green-700 dark:text-green-200">
              ✓ Tu cuenta de Instagram está conectada. Los mensajes directos aparecerán automáticamente en el CRM.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
