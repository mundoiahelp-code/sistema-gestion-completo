'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Instagram, CheckCircle, XCircle, ExternalLink, Copy, Check } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useTranslation } from '@/i18n/I18nProvider';

export default function InstagramSettings() {
  const { t } = useTranslation();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [username, setUsername] = useState('');
  
  // Formulario de conexión
  const [pageId, setPageId] = useState('');
  const [pageAccessToken, setPageAccessToken] = useState('');
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL}/instagram/webhook`;
  const verifyToken = 'mi_token_secreto_123'; // Debe coincidir con el del servidor

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const token = Cookies.get('token');
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

  const handleConnect = async () => {
    if (!pageId || !pageAccessToken) {
      setError(t('settings.instagramSettings.pageIdRequired'));
      return;
    }

    setConnecting(true);
    setError('');
    setSuccess('');

    try {
      const token = Cookies.get('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/instagram/connect`,
        { pageId, pageAccessToken, appId, appSecret },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        setConnected(true);
        setUsername(pageId);
        // Limpiar formulario
        setPageId('');
        setPageAccessToken('');
        setAppId('');
        setAppSecret('');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || t('settings.instagramSettings.connectError'));
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm(t('settings.instagramSettings.disconnectConfirm'))) return;

    try {
      const token = Cookies.get('token');
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/instagram/disconnect`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setConnected(false);
      setUsername('');
      setSuccess(t('settings.instagramSettings.disconnectSuccess'));
    } catch (error) {
      setError(t('settings.instagramSettings.disconnectError'));
    }
  };

  const copyToClipboard = async (text: string, type: 'webhook' | 'token') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'webhook') {
        setCopiedWebhook(true);
        setTimeout(() => setCopiedWebhook(false), 2000);
      } else {
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
      }
    } catch (error) {
      console.error('Error copiando:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="w-5 h-5" />
            Instagram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">{t('common.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Instagram className="w-5 h-5" />
          {t('settings.instagramSettings.title')}
        </CardTitle>
        <CardDescription>
          {t('settings.instagramSettings.description')}
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
                  <p className="font-medium dark:text-zinc-100">{t('settings.instagramSettings.connected')}</p>
                  {username && <p className="text-sm text-gray-500 dark:text-zinc-400">@{username}</p>}
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium dark:text-zinc-100">{t('settings.instagramSettings.notConnected')}</p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400">{t('settings.instagramSettings.connectToStart')}</p>
                </div>
              </>
            )}
          </div>
          {connected && (
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              {t('settings.instagramSettings.disconnect')}
            </Button>
          )}
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

        {/* Formulario de conexión */}
        {!connected && (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="pageId">{t('settings.instagramSettings.pageId')}</Label>
                <Input
                  id="pageId"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  placeholder="123456789012345"
                />
              </div>

              <div>
                <Label htmlFor="pageAccessToken">{t('settings.instagramSettings.pageAccessToken')}</Label>
                <Input
                  id="pageAccessToken"
                  type="password"
                  value={pageAccessToken}
                  onChange={(e) => setPageAccessToken(e.target.value)}
                  placeholder="EAAxxxxxxxxxx..."
                />
              </div>

              <div>
                <Label htmlFor="appId">{t('settings.instagramSettings.appId')}</Label>
                <Input
                  id="appId"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="123456789012345"
                />
              </div>

              <div>
                <Label htmlFor="appSecret">{t('settings.instagramSettings.appSecret')}</Label>
                <Input
                  id="appSecret"
                  type="password"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxx"
                />
              </div>

              <Button
                onClick={handleConnect}
                disabled={connecting || !pageId || !pageAccessToken}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {connecting ? t('settings.instagramSettings.connecting') : t('settings.instagramSettings.connectInstagram')}
              </Button>
            </div>

            {/* Botón de instrucciones */}
            <Button
              variant="outline"
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full"
            >
              {showInstructions ? t('settings.instagramSettings.hideInstructions') : t('settings.instagramSettings.showInstructions')}
            </Button>

            {/* Instrucciones */}
            {showInstructions && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg text-sm">
                <h4 className="font-semibold flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  {t('settings.instagramSettings.instructionsTitle')}
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <p className="font-medium mb-1">{t('settings.instagramSettings.step1Title')}</p>
                    <p className="text-gray-600">
                      {t('settings.instagramSettings.step1Desc')}{' '}
                      <a
                        href="https://developers.facebook.com/apps"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Facebook Developers
                      </a>
                    </p>
                  </div>

                  <div>
                    <p className="font-medium mb-1">{t('settings.instagramSettings.step2Title')}</p>
                    <p className="text-gray-600">
                      {t('settings.instagramSettings.step2Desc')}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium mb-1">{t('settings.instagramSettings.step3Title')}</p>
                    <p className="text-gray-600">
                      {t('settings.instagramSettings.step3Desc')}
                    </p>
                  </div>

                  <div>
                    <p className="font-medium mb-1">{t('settings.instagramSettings.step4Title')}</p>
                    <p className="text-gray-600">
                      {t('settings.instagramSettings.step4Desc')}
                      <code className="block mt-1 p-2 bg-white dark:bg-zinc-700 rounded text-xs dark:text-zinc-200">
                        pages_messaging, instagram_basic, instagram_manage_messages
                      </code>
                    </p>
                  </div>

                  <div>
                    <p className="font-medium mb-1">{t('settings.instagramSettings.step5Title')}</p>
                    <p className="text-gray-600 mb-2">
                      {t('settings.instagramSettings.step5Desc')}
                    </p>
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-700 rounded">
                      <code className="flex-1 text-xs break-all dark:text-zinc-200">{webhookUrl}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                      >
                        {copiedWebhook ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-gray-600 mt-2 mb-2">{t('settings.instagramSettings.verifyToken')}</p>
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-700 rounded">
                      <code className="flex-1 text-xs dark:text-zinc-200">{verifyToken}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(verifyToken, 'token')}
                      >
                        {copiedToken ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-gray-600 mt-2">
                      {t('settings.instagramSettings.subscribeFields')} <code className="bg-white dark:bg-zinc-700 px-1 rounded dark:text-zinc-200">messages</code> {t('settings.instagramSettings.and')}{' '}
                      <code className="bg-white dark:bg-zinc-700 px-1 rounded dark:text-zinc-200">messaging_postbacks</code>
                    </p>
                  </div>

                  <div>
                    <p className="font-medium mb-1">{t('settings.instagramSettings.step6Title')}</p>
                    <p className="text-gray-600">
                      {t('settings.instagramSettings.step6Desc')}
                    </p>
                  </div>
                </div>

                <Alert>
                  <AlertDescription className="text-xs">
                    <strong>{t('settings.instagramSettings.noteTitle')}</strong> {t('settings.instagramSettings.noteDesc')}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </>
        )}

        {/* Info adicional cuando está conectado */}
        {connected && (
          <div className="p-4 bg-green-50 rounded-lg text-sm">
            <p className="text-green-700">
              ✓ {t('settings.instagramSettings.connectedInfo')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
