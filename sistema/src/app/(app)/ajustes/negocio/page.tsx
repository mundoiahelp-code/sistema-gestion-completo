'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { Building2, Save, Loader2, Phone, CreditCard, Truck } from 'lucide-react';
import { useTranslation } from '@/i18n/I18nProvider';
import { getFeaturesForLocale } from '@/lib/features';

interface TenantData {
  id: string;
  name: string;
  whatsapp?: string;
  whatsappAsesor?: string;
  instagram?: string;
  website?: string;
  botPaymentMethods?: string;
  botWarrantyDays?: number;
  botShipsOrders?: boolean;
  shippingZones?: string;
  shippingTime?: string;
  returnPolicy?: string;
  reservationDeposit?: string;
  acceptsDeposit?: boolean;
}

const PAYMENT_OPTIONS_ES = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'tarjeta', label: 'Tarjeta' },
  { id: 'usdt', label: 'USDT/Crypto' },
];

const PAYMENT_OPTIONS_EN = [
  { id: 'cash', label: 'Cash' },
  { id: 'transfer', label: 'Bank Transfer' },
  { id: 'card', label: 'Card' },
  { id: 'crypto', label: 'Crypto' },
];

export default function NegocioPage() {
  const { locale } = useTranslation();
  const localeFeatures = getFeaturesForLocale(locale);
  const isSpanish = locale === 'es';
  const PAYMENT_OPTIONS = isSpanish ? PAYMENT_OPTIONS_ES : PAYMENT_OPTIONS_EN;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [acceptsDeposit, setAcceptsDeposit] = useState(false);

  useEffect(() => {
    fetchTenant();
  }, []);

  const fetchTenant = async () => {
    try {
      const token = Cookies.get('accessToken') || localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/current`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.tenant) {
        setTenant(data.tenant);
        setPaymentMethods((data.tenant.botPaymentMethods || '').split(',').filter(Boolean));
        setAcceptsDeposit(!!data.tenant.reservationDeposit);
      }
    } catch (error) {
      toast.error(isSpanish ? 'Error al cargar datos del negocio' : 'Error loading business data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!tenant) return;
    
    setSaving(true);
    try {
      const token = Cookies.get('accessToken') || localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          whatsapp: tenant.whatsapp,
          whatsappAsesor: tenant.whatsappAsesor,
          instagram: tenant.instagram,
          website: tenant.website,
          botPaymentMethods: paymentMethods.join(','),
          botWarrantyDays: tenant.botWarrantyDays,
          botShipsOrders: tenant.botShipsOrders,
          shippingZones: tenant.shippingZones,
          shippingTime: tenant.shippingTime,
          returnPolicy: tenant.returnPolicy,
          reservationDeposit: acceptsDeposit ? tenant.reservationDeposit : null,
        })
      });

      if (res.ok) {
        toast.success(isSpanish ? 'Datos guardados correctamente' : 'Data saved successfully');
        
        // Notificar al bot que se actualizó la configuración
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bot/reload-config`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          });
        } catch (error) {
          console.error('Error notifying bot:', error);
        }
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || (isSpanish ? 'Error al guardar' : 'Error saving'));
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(isSpanish ? 'Error al guardar' : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof TenantData, value: string | number | boolean) => {
    if (tenant) {
      setTenant({ ...tenant, [field]: value });
    }
  };

  const handlePaymentToggle = (paymentId: string) => {
    setPaymentMethods(prev => 
      prev.includes(paymentId)
        ? prev.filter(p => p !== paymentId)
        : [...prev, paymentId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {isSpanish ? 'No se encontraron datos del negocio' : 'Business data not found'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Business Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isSpanish ? 'Datos del Negocio' : 'Business Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{isSpanish ? 'Nombre del negocio' : 'Business name'}</Label>
            <div className="px-3 py-2 bg-muted rounded-md text-sm font-medium">
              {tenant.name}
            </div>
            <p className="text-xs text-muted-foreground">
              {isSpanish ? 'Se configura en el wizard inicial' : 'Configured during initial setup'}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={tenant.instagram || ''}
                onChange={(e) => handleChange('instagram', e.target.value)}
                placeholder="@yourbusiness"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">{isSpanish ? 'Sitio web' : 'Website'}</Label>
              <Input
                id="website"
                value={tenant.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://yourbusiness.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp - Only for Spanish */}
      {localeFeatures.whatsapp && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp del negocio</Label>
                <Input
                  id="whatsapp"
                  value={tenant.whatsapp || ''}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  placeholder="5491112345678"
                />
                <p className="text-xs text-muted-foreground">El asistente responde desde este número</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappAsesor">WhatsApp del asesor</Label>
                <Input
                  id="whatsappAsesor"
                  value={tenant.whatsappAsesor || ''}
                  onChange={(e) => handleChange('whatsappAsesor', e.target.value)}
                  placeholder="5491198765432"
                />
                <p className="text-xs text-muted-foreground">Para derivar consultas complejas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipping - Only for Spanish */}
      {localeFeatures.bot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Envíos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={tenant.botShipsOrders || false}
                onCheckedChange={(checked) => handleChange('botShipsOrders', checked)}
              />
              <span>{tenant.botShipsOrders ? 'Sí, hacemos envíos' : 'No hacemos envíos'}</span>
            </div>
            {tenant.botShipsOrders && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="shippingZones">Zonas de envío</Label>
                  <Input
                    id="shippingZones"
                    value={tenant.shippingZones || ''}
                    onChange={(e) => handleChange('shippingZones', e.target.value)}
                    placeholder="CABA, GBA Sur, GBA Norte"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingTime">Tiempo de entrega</Label>
                  <Input
                    id="shippingTime"
                    value={tenant.shippingTime || ''}
                    onChange={(e) => handleChange('shippingTime', e.target.value)}
                    placeholder="24-48hs en CABA, 3-5 días interior"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sales and Policies - Only for Spanish */}
      {localeFeatures.bot && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Ventas y Políticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>Métodos de pago</Label>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_OPTIONS.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethods.includes(option.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handlePaymentToggle(option.id)}
                  >
                    <Checkbox checked={paymentMethods.includes(option.id)} />
                    <span>{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="warranty">Días de garantía</Label>
              <Input
                id="warranty"
                type="number"
                value={tenant.botWarrantyDays || 30}
                onChange={(e) => handleChange('botWarrantyDays', parseInt(e.target.value) || 30)}
                min={0}
                className="w-32"
              />
            </div>

            {/* Deposit */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <Switch
                  checked={acceptsDeposit}
                  onCheckedChange={setAcceptsDeposit}
                />
                <span>{acceptsDeposit ? 'Sí, aceptamos seña para reservar' : 'No aceptamos seña'}</span>
              </div>
              {acceptsDeposit && (
                <div className="space-y-2 pl-1">
                  <Label htmlFor="reservationDeposit">¿Cuánto es el minimo de seña?</Label>
                  <Input
                    id="reservationDeposit"
                    value={tenant.reservationDeposit || ''}
                    onChange={(e) => handleChange('reservationDeposit', e.target.value)}
                    placeholder="ej: 20%, $50.000, 100 USD"
                    className="max-w-xs"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <Label htmlFor="returnPolicy">Política de devoluciones</Label>
              <Textarea
                id="returnPolicy"
                value={tenant.returnPolicy || ''}
                onChange={(e) => handleChange('returnPolicy', e.target.value)}
                placeholder="7 días para cambio por fallas de fábrica"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSpanish ? 'Guardar cambios' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
