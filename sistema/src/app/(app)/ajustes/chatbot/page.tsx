'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { Bot, Save, Loader2, MessageSquare, CreditCard } from 'lucide-react';
import { getFeaturesForLocale } from '@/lib/features';
import { useTranslation } from '@/i18n/I18nProvider';

interface BotConfig {
  botEnabled: boolean;
  botTone: string;
  botLanguage: string;
  botGreeting?: string;
  botFarewell?: string;
  botExtraInfo?: string;
  botWarrantyDays: number;
  botShipsOrders: boolean;
  botPaymentMethods: string;
  botWorkingHours?: string;
  botLocation?: string;
}

// Disabled message component
function BotDisabledMessage({ locale }: { locale: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Asistente IA</h2>
        <p className="text-gray-600 dark:text-gray-400">
          {locale === 'es' 
            ? 'El asistente IA no está disponible en esta versión.'
            : 'AI Assistant is not available in this version.'}
        </p>
      </div>
    </div>
  );
}

export default function ChatbotPage() {
  const { t, locale } = useTranslation();
  const localeFeatures = getFeaturesForLocale(locale);
  
  // If bot feature is disabled (English locale), show message
  if (!localeFeatures.bot) {
    return <BotDisabledMessage locale={locale} />;
  }
  
  return <ChatbotPageContent />;
}

function ChatbotPageContent() {
  const { t, locale } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BotConfig>({
    botEnabled: true,
    botTone: 'amigable',
    botLanguage: 'argentino',
    botWarrantyDays: 30,
    botShipsOrders: false,
    botPaymentMethods: 'efectivo,transferencia,usdt'
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = Cookies.get('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/current`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.tenant) {
        setConfig({
          botEnabled: data.tenant.botEnabled ?? true,
          botTone: data.tenant.botTone || 'amigable',
          botLanguage: data.tenant.botLanguage || 'argentino',
          botGreeting: data.tenant.botGreeting || '',
          botFarewell: data.tenant.botFarewell || '',
          botExtraInfo: data.tenant.botExtraInfo || '',
          botWarrantyDays: data.tenant.botWarrantyDays || 30,
          botShipsOrders: data.tenant.botShipsOrders ?? false,
          botPaymentMethods: data.tenant.botPaymentMethods || 'efectivo,transferencia,usdt',
          botWorkingHours: data.tenant.botWorkingHours || '',
          botLocation: data.tenant.botLocation || ''
        });
      }
    } catch (error) {
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = Cookies.get('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/current/bot`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      if (res.ok) {
        toast.success('Configuración guardada');
      } else {
        toast.error('Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado del asistente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Estado del Asistente
          </CardTitle>
          <CardDescription>
            Activá o desactivá el asistente automático de WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Asistente activo</p>
              <p className="text-sm text-muted-foreground">
                Cuando está activo, el asistente responde automáticamente los mensajes de WhatsApp
              </p>
            </div>
            <Switch
              checked={config.botEnabled}
              onCheckedChange={(checked) => setConfig({ ...config, botEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Personalidad del asistente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Personalidad del Asistente
          </CardTitle>
          <CardDescription>
            Configurá cómo habla y se comporta el asistente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tono de comunicación</Label>
              <Select
                value={config.botTone}
                onValueChange={(value) => setConfig({ ...config, botTone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amigable">Amigable (cercano, cálido)</SelectItem>
                  <SelectItem value="formal">Formal (profesional)</SelectItem>
                  <SelectItem value="neutro">Neutro (equilibrado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estilo de lenguaje</Label>
              <Select
                value={config.botLanguage}
                onValueChange={(value) => setConfig({ ...config, botLanguage: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="argentino">Argentino (dale, joya, tranqui)</SelectItem>
                  <SelectItem value="neutro">Español neutro</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="greeting">Saludo personalizado (opcional)</Label>
            <Input
              id="greeting"
              value={config.botGreeting || ''}
              onChange={(e) => setConfig({ ...config, botGreeting: e.target.value })}
              placeholder="ej: buenas! todo bien? en qué te puedo ayudar?"
            />
            <p className="text-xs text-muted-foreground">
              Dejalo vacío para usar el saludo por defecto
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="farewell">Despedida personalizada (opcional)</Label>
            <Input
              id="farewell"
              value={config.botFarewell || ''}
              onChange={(e) => setConfig({ ...config, botFarewell: e.target.value })}
              placeholder="ej: dale, cualquier cosa avisame!"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="extraInfo">Información adicional para el asistente</Label>
            <Textarea
              id="extraInfo"
              value={config.botExtraInfo || ''}
              onChange={(e) => setConfig({ ...config, botExtraInfo: e.target.value })}
              placeholder="Información extra que el asistente debe saber sobre tu negocio (promociones, políticas especiales, etc.)"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Información del negocio para el asistente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Información del Negocio
          </CardTitle>
          <CardDescription>
            Datos que el asistente usará para responder consultas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="warranty">Días de garantía</Label>
              <Input
                id="warranty"
                type="number"
                value={config.botWarrantyDays}
                onChange={(e) => setConfig({ ...config, botWarrantyDays: parseInt(e.target.value) || 30 })}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>¿Hacen envíos?</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={config.botShipsOrders}
                  onCheckedChange={(checked) => setConfig({ ...config, botShipsOrders: checked })}
                />
                <span className="text-sm text-muted-foreground">
                  {config.botShipsOrders ? 'Sí, hacemos envíos' : 'No, solo retiro en sucursal'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payments">Métodos de pago</Label>
            <Input
              id="payments"
              value={config.botPaymentMethods}
              onChange={(e) => setConfig({ ...config, botPaymentMethods: e.target.value })}
              placeholder="efectivo,transferencia,usdt"
            />
            <p className="text-xs text-muted-foreground">
              Separados por coma. Ej: efectivo, transferencia, usdt, tarjeta
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="hours">Horario de atención</Label>
              <Input
                id="hours"
                value={config.botWorkingHours || ''}
                onChange={(e) => setConfig({ ...config, botWorkingHours: e.target.value })}
                placeholder="ej: Lunes a Viernes 9 a 19hs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Zona/Ubicación</Label>
              <Input
                id="location"
                value={config.botLocation || ''}
                onChange={(e) => setConfig({ ...config, botLocation: e.target.value })}
                placeholder="ej: Zona Sur, Adrogué"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar configuración
        </Button>
      </div>
    </div>
  );
}
