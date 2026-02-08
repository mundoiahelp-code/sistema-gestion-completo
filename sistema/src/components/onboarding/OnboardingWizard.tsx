'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { Building2, Phone, CreditCard, ChevronRight, ChevronLeft, Check, Loader2, CheckCircle2, Store, Plus, Trash2, Clock } from 'lucide-react';
import { useTranslation } from '@/i18n/I18nProvider';
import { getFeaturesForLocale } from '@/lib/features';

interface OnboardingData {
  name: string;
  instagram: string;
  website: string;
  whatsapp: string;
  whatsappAsesor: string;
  botPaymentMethods: string[];
  botWarrantyDays: number;
  botShipsOrders: boolean;
  // Sucursales
  stores: Array<{
    name: string;
    address: string;
    phone: string;
    mondayHours: string;
    tuesdayHours: string;
    wednesdayHours: string;
    thursdayHours: string;
    fridayHours: string;
    saturdayHours: string;
    sundayHours: string;
  }>;
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

export default function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const { locale } = useTranslation();
  const localeFeatures = getFeaturesForLocale(locale);
  const isSpanish = locale === 'es';
  
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    instagram: '',
    website: '',
    whatsapp: '',
    whatsappAsesor: '',
    botPaymentMethods: isSpanish ? ['efectivo', 'transferencia'] : ['cash', 'transfer'],
    botWarrantyDays: 30,
    botShipsOrders: false,
    stores: [{
      name: isSpanish ? 'Depósito' : 'Warehouse',
      address: '',
      phone: '',
      mondayHours: '09:00-19:00',
      tuesdayHours: '09:00-19:00',
      wednesdayHours: '09:00-19:00',
      thursdayHours: '09:00-19:00',
      fridayHours: '09:00-19:00',
      saturdayHours: '09:00-17:00',
      sundayHours: '',
    }]
  });

  // Spanish: 5 steps (business, stores, whatsapp, sales, confirm)
  // English: 3 steps (business, stores, confirm)
  const totalSteps = isSpanish ? 5 : 3;
  const PAYMENT_OPTIONS = isSpanish ? PAYMENT_OPTIONS_ES : PAYMENT_OPTIONS_EN;

  const canContinue = () => {
    if (isSpanish) {
      switch (step) {
        case 1: return data.name.trim().length >= 2;
        case 2: return data.stores.length > 0 && data.stores[0].name.trim().length >= 2;
        case 3: return data.whatsapp.trim().length >= 8;
        case 4: return data.botPaymentMethods.length > 0;
        case 5: return true;
        default: return true;
      }
    } else {
      switch (step) {
        case 1: return data.name.trim().length >= 2;
        case 2: return data.stores.length > 0 && data.stores[0].name.trim().length >= 2;
        case 3: return true;
        default: return true;
      }
    }
  };

  const handlePaymentToggle = (paymentId: string) => {
    setData(prev => ({
      ...prev,
      botPaymentMethods: prev.botPaymentMethods.includes(paymentId)
        ? prev.botPaymentMethods.filter(p => p !== paymentId)
        : [...prev.botPaymentMethods, paymentId]
    }));
  };

  const addStore = () => {
    setData(prev => ({
      ...prev,
      stores: [...prev.stores, {
        name: isSpanish ? `Sucursal ${prev.stores.length + 1}` : `Store ${prev.stores.length + 1}`,
        address: '',
        phone: '',
        mondayHours: '09:00-19:00',
        tuesdayHours: '09:00-19:00',
        wednesdayHours: '09:00-19:00',
        thursdayHours: '09:00-19:00',
        fridayHours: '09:00-19:00',
        saturdayHours: '09:00-17:00',
        sundayHours: '',
      }]
    }));
  };

  const removeStore = (index: number) => {
    if (data.stores.length > 1) {
      setData(prev => ({
        ...prev,
        stores: prev.stores.filter((_, i) => i !== index)
      }));
    }
  };

  const updateStore = (index: number, field: string, value: string) => {
    setData(prev => ({
      ...prev,
      stores: prev.stores.map((store, i) => 
        i === index ? { ...store, [field]: value } : store
      )
    }));
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const token = Cookies.get('token');
      
      // 1. Actualizar tenant
      const tenantRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tenants/current/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: data.name,
          instagram: data.instagram,
          website: data.website,
          whatsapp: data.whatsapp,
          whatsappAsesor: data.whatsappAsesor,
          botPaymentMethods: data.botPaymentMethods.join(','),
          botWarrantyDays: data.botWarrantyDays,
          botShipsOrders: data.botShipsOrders,
        })
      });

      if (!tenantRes.ok) {
        throw new Error('Error al guardar configuración del negocio');
      }

      // 2. Crear/actualizar sucursales
      for (let i = 0; i < data.stores.length; i++) {
        const storeData = data.stores[i];
        
        if (i === 0) {
          // Actualizar la primera sucursal si existe, o crearla
          const storesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stores`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (storesRes.ok) {
            const { stores: existingStores } = await storesRes.json();
            
            if (existingStores.length > 0) {
              // Actualizar la primera sucursal existente
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stores/${existingStores[0].id}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(storeData)
              });
            } else {
              // No hay sucursales, crear la primera
              await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stores`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(storeData)
              });
            }
          }
        } else {
          // Crear sucursales adicionales
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stores`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(storeData)
          });
        }
      }

      localStorage.setItem('tenantName', data.name);
      window.dispatchEvent(new Event('storage'));
      toast.success(isSpanish ? '¡Configuración completada!' : 'Setup completed!');
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      toast.error(isSpanish ? 'Error al guardar' : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    // STEP 1: Business info (both languages)
    if (step === 1) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-full">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{isSpanish ? 'Tu Negocio' : 'Your Business'}</h3>
              <p className="text-sm text-muted-foreground">
                {isSpanish ? 'Información básica de tu marca' : 'Basic information about your brand'}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">{isSpanish ? 'Nombre del negocio *' : 'Business name *'}</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder={isSpanish ? 'ej: Mundo Apple' : 'e.g: iPhone Store NYC'}
              className="text-lg py-6"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {isSpanish 
                ? 'Aparecerá en comprobantes de venta y en el sistema'
                : 'Will appear on receipts and throughout the system'}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 pt-2">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={data.instagram}
                onChange={(e) => setData({ ...data, instagram: e.target.value })}
                placeholder="@instagramapple"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">{isSpanish ? 'Sitio web (opcional)' : 'Website (optional)'}</Label>
              <Input
                id="website"
                value={data.website}
                onChange={(e) => setData({ ...data, website: e.target.value })}
                placeholder="https://tusitioweb.com"
              />
            </div>
          </div>
        </div>
      );
    }

    // STEP 2: Stores (both languages)
    if (step === 2) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-full">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{isSpanish ? 'Sucursales' : 'Stores'}</h3>
              <p className="text-sm text-muted-foreground">
                {isSpanish ? 'Agregá tus puntos de venta o depósitos' : 'Add your store locations or warehouses'}
              </p>
            </div>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {data.stores.map((store, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{isSpanish ? `Sucursal ${index + 1}` : `Store ${index + 1}`}</h4>
                  {data.stores.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStore(index)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>{isSpanish ? 'Nombre *' : 'Name *'}</Label>
                    <Input
                      value={store.name}
                      onChange={(e) => updateStore(index, 'name', e.target.value)}
                      placeholder={isSpanish ? 'Ej: Centro, Zona Norte, Depósito' : 'E.g: Downtown, North Zone, Warehouse'}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isSpanish 
                        ? 'Usá este nombre para identificar dónde está cada producto'
                        : 'Use this name to identify where each product is located'}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={addStore}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isSpanish ? 'Agregar otra sucursal' : 'Add another store'}
          </Button>
        </div>
      );
    }

    // SPANISH STEP 3: WhatsApp (was step 2)
    if (isSpanish && step === 3) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-full">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">WhatsApp</h3>
              <p className="text-sm text-muted-foreground">Números de contacto</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp del negocio *</Label>
              <Input
                id="whatsapp"
                value={data.whatsapp}
                onChange={(e) => setData({ ...data, whatsapp: e.target.value })}
                placeholder="5491112345678"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Sin espacios ni guiones. El asistente responderá desde este número.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappAsesor">WhatsApp del asesor</Label>
              <Input
                id="whatsappAsesor"
                value={data.whatsappAsesor}
                onChange={(e) => setData({ ...data, whatsappAsesor: e.target.value })}
                placeholder="5491198765432"
              />
              <p className="text-xs text-muted-foreground">
                Cuando el asistente no pueda resolver algo, derivará al cliente a este número.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // SPANISH STEP 4: Sales/Payments (was step 3)
    if (isSpanish && step === 4) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-full">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Ventas</h3>
              <p className="text-sm text-muted-foreground">Métodos de pago y políticas</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Métodos de pago que aceptás *</Label>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_OPTIONS.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      data.botPaymentMethods.includes(option.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handlePaymentToggle(option.id)}
                  >
                    <Checkbox checked={data.botPaymentMethods.includes(option.id)} />
                    <span>{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="warranty">Días de garantía</Label>
                <Input
                  id="warranty"
                  type="number"
                  value={data.botWarrantyDays}
                  onChange={(e) => setData({ ...data, botWarrantyDays: parseInt(e.target.value) || 30 })}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>¿Hacen envíos?</Label>
                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    checked={data.botShipsOrders}
                    onCheckedChange={(checked) => setData({ ...data, botShipsOrders: checked })}
                  />
                  <span className="text-sm">{data.botShipsOrders ? 'Sí, hacemos envíos' : 'No, solo retiro'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // CONFIRMATION STEP (last step for both)
    if ((isSpanish && step === 5) || (!isSpanish && step === 3)) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {isSpanish ? 'Confirmá tus datos' : 'Confirm your details'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isSpanish ? 'Revisá que todo esté bien' : 'Review your information'}
              </p>
            </div>
          </div>
          
          <div className="space-y-3 bg-muted/50 rounded-lg p-4">
            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">
                {isSpanish ? 'Nombre del negocio' : 'Business name'}
              </span>
              <span className="font-medium">{data.name}</span>
            </div>
            
            {data.instagram && (
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Instagram</span>
                <span className="font-medium">{data.instagram}</span>
              </div>
            )}
            
            {data.website && (
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">{isSpanish ? 'Sitio web' : 'Website'}</span>
                <span className="font-medium">{data.website}</span>
              </div>
            )}

            <div className="flex justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground">{isSpanish ? 'Sucursales' : 'Stores'}</span>
              <span className="font-medium">{data.stores.length}</span>
            </div>
            
            {isSpanish && (
              <>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">WhatsApp negocio</span>
                  <span className="font-medium">{data.whatsapp}</span>
                </div>
                
                {data.whatsappAsesor && (
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">WhatsApp asesor</span>
                    <span className="font-medium">{data.whatsappAsesor}</span>
                  </div>
                )}
                
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Métodos de pago</span>
                  <span className="font-medium">{data.botPaymentMethods.join(', ')}</span>
                </div>
                
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Garantía</span>
                  <span className="font-medium">{data.botWarrantyDays} días</span>
                </div>
                
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Envíos</span>
                  <span className="font-medium">{data.botShipsOrders ? 'Sí' : 'No'}</span>
                </div>
              </>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground text-center pt-2">
            {isSpanish 
              ? 'Podés modificar estos datos después en Ajustes → Negocio'
              : 'You can change this later in Settings → Business'}
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">
            {isSpanish ? 'Configurá tu negocio' : 'Set up your business'}
          </CardTitle>
          <CardDescription>
            {isSpanish ? `Paso ${step} de ${totalSteps}` : `Step ${step} of ${totalSteps}`}
          </CardDescription>
          <div className="flex gap-1 mt-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {renderStep()}
          
          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {isSpanish ? 'Atrás' : 'Back'}
            </Button>
            
            {step < totalSteps ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={!canContinue()}
              >
                {isSpanish ? 'Siguiente' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {isSpanish ? 'Confirmar y finalizar' : 'Confirm and finish'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
