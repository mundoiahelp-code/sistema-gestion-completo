'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, MessageSquare, ShoppingCart, AlertTriangle, TrendingUp, Package, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useSonner from '@/hooks/useSonner';
import useCookie from '@/hooks/useCookie';
import { API } from '@/config/api';
import { useTranslation } from '@/i18n/I18nProvider';

interface NotificationPreference {
  id: string;
  label: string;
  description: string;
  icon: any;
  enabled: boolean;
  category: 'bot' | 'ventas' | 'turnos' | 'sistema';
}

export default function NotificationSettings() {
  const { t } = useTranslation();
  const { handleSuccessSonner, handleErrorSonner } = useSonner();
  const [accessToken] = useCookie('accessToken', false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [notifications, setNotifications] = useState<NotificationPreference[]>([
    // Ventas
    {
      id: 'sale_completed',
      label: 'saleCompleted',
      description: 'saleCompletedDesc',
      icon: ShoppingCart,
      enabled: true,
      category: 'ventas',
    },
    {
      id: 'sale_high_value',
      label: 'saleHighValue',
      description: 'saleHighValueDesc',
      icon: TrendingUp,
      enabled: true,
      category: 'ventas',
    },
    
    // Sistema
    {
      id: 'stock_low',
      label: 'stockLow',
      description: 'stockLowDesc',
      icon: Package,
      enabled: true,
      category: 'sistema',
    },
  ]);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/notifications/preferences`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const prefs = response.data;
      
      // Mapear las preferencias del backend a nuestro estado
      const mapping: Record<string, keyof typeof prefs> = {
        sale_completed: 'saleCompleted',
        sale_high_value: 'saleHighValue',
        stock_low: 'stockLow',
      };

      setNotifications(prev =>
        prev.map(notif => ({
          ...notif,
          enabled: prefs[mapping[notif.id]] ?? notif.enabled,
        }))
      );
    } catch (error) {
      console.error('Error loading preferences:', error);
      handleErrorSonner(t('settings.notificationSettings.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    // Actualizar UI inmediatamente
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, enabled: !notif.enabled } : notif
      )
    );

    try {
      setSaving(true);
      
      // Mapear IDs a nombres del backend
      const mapping: Record<string, string> = {
        sale_completed: 'saleCompleted',
        sale_high_value: 'saleHighValue',
        stock_low: 'stockLow',
      };

      // Construir objeto de preferencias
      const preferences = notifications.reduce((acc, notif) => {
        const backendKey = mapping[notif.id];
        acc[backendKey] = notif.id === id ? !notif.enabled : notif.enabled;
        return acc;
      }, {} as Record<string, boolean>);

      await axios.put(
        `${API}/notifications/preferences`,
        preferences,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      handleSuccessSonner(t('settings.notificationSettings.notificationUpdated'));
    } catch (error) {
      console.error('Error saving preferences:', error);
      handleErrorSonner(t('settings.notificationSettings.saveError'));
      // Revertir cambio en caso de error
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, enabled: !notif.enabled } : notif
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { id: 'ventas', title: t('settings.notificationSettings.sales'), description: t('settings.notificationSettings.salesDesc') },
    { id: 'sistema', title: t('settings.notificationSettings.system'), description: t('settings.notificationSettings.systemDesc') },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bell className='h-5 w-5' />
            {t('settings.notificationSettings.title')}
            {saving && <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />}
          </CardTitle>
          <CardDescription>
            {t('settings.notificationSettings.description')}
          </CardDescription>
        </CardHeader>
      </Card>

      {categories.map((category) => {
        const categoryNotifications = notifications.filter(n => n.category === category.id);
        
        return (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className='text-lg'>{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {categoryNotifications.map((notification, index) => {
                const Icon = notification.icon;
                return (
                  <div key={notification.id}>
                    {index > 0 && <Separator className='my-4' />}
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex items-start gap-3 flex-1'>
                        <div className='mt-1 p-2 rounded-lg bg-primary/10'>
                          <Icon className='h-4 w-4 text-primary' />
                        </div>
                        <div className='space-y-1 flex-1'>
                          <Label
                            htmlFor={notification.id}
                            className='text-sm font-medium leading-none cursor-pointer'
                          >
                            {t(`settings.notificationSettings.${notification.label}`)}
                          </Label>
                          <p className='text-sm text-muted-foreground'>
                            {t(`settings.notificationSettings.${notification.description}`)}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id={notification.id}
                        checked={notification.enabled}
                        onCheckedChange={() => handleToggle(notification.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Configuración de números de WhatsApp */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5' />
            {t('settings.notificationSettings.whatsappNotifications')}
          </CardTitle>
          <CardDescription>
            {t('settings.notificationSettings.whatsappNotificationsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WhatsAppNotificationNumbers />
        </CardContent>
      </Card>

      <Card className='border-primary/20 bg-primary/5'>
        <CardContent className='pt-6'>
          <div className='flex items-start gap-3'>
            <Bell className='h-5 w-5 text-primary mt-0.5' />
            <div className='space-y-1'>
              <p className='text-sm font-medium'>{t('settings.notificationSettings.howItWorks')}</p>
              <p className='text-sm text-muted-foreground'>
                {t('settings.notificationSettings.howItWorksDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para gestionar números de WhatsApp
function WhatsAppNotificationNumbers() {
  const { t } = useTranslation();
  const { handleSuccessSonner, handleErrorSonner } = useSonner();
  const [accessToken] = useCookie('accessToken', false);
  const [numbers, setNumbers] = useState<Array<{ id: string; name: string; phone: string; enabled: boolean }>>([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNumbers();
  }, []);

  const loadNumbers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/notifications/whatsapp-numbers`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setNumbers(response.data || []);
    } catch (error) {
      console.error('Error loading numbers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addNumber = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      handleErrorSonner(t('settings.notificationSettings.fillAllFields'));
      return;
    }

    // Validar formato de teléfono (solo números)
    const cleanPhone = newPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      handleErrorSonner(t('settings.notificationSettings.invalidPhone'));
      return;
    }

    try {
      setAdding(true);
      const response = await axios.post(
        `${API}/notifications/whatsapp-numbers`,
        { name: newName, phone: cleanPhone },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setNumbers([...numbers, response.data]);
      setNewName('');
      setNewPhone('');
      handleSuccessSonner(t('settings.notificationSettings.numberAdded'));
    } catch (error: any) {
      handleErrorSonner(error.response?.data?.error || t('settings.notificationSettings.addNumberError'));
    } finally {
      setAdding(false);
    }
  };

  const toggleNumber = async (id: string) => {
    try {
      const number = numbers.find(n => n.id === id);
      if (!number) return;

      await axios.patch(
        `${API}/notifications/whatsapp-numbers/${id}`,
        { enabled: !number.enabled },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setNumbers(numbers.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n));
      handleSuccessSonner(t('settings.notificationSettings.configUpdated'));
    } catch (error) {
      handleErrorSonner(t('settings.notificationSettings.updateError'));
    }
  };

  const deleteNumber = async (id: string) => {
    if (!confirm(t('settings.notificationSettings.deleteNumberConfirm'))) return;

    try {
      await axios.delete(`${API}/notifications/whatsapp-numbers/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setNumbers(numbers.filter(n => n.id !== id));
      handleSuccessSonner(t('settings.notificationSettings.numberDeleted'));
    } catch (error) {
      handleErrorSonner(t('settings.notificationSettings.deleteError'));
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Lista de números */}
      {numbers.length > 0 ? (
        <div className='space-y-3'>
          {numbers.map((number) => (
            <div key={number.id} className='flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50'>
              <div className='flex items-center gap-3 flex-1'>
                <div className='p-2 rounded-lg bg-green-100 dark:bg-green-900/30'>
                  <MessageSquare className='h-4 w-4 text-green-600' />
                </div>
                <div>
                  <p className='font-medium text-sm dark:text-zinc-100'>{number.name}</p>
                  <p className='text-xs text-muted-foreground'>+{number.phone}</p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Switch
                  checked={number.enabled}
                  onCheckedChange={() => toggleNumber(number.id)}
                />
                <button
                  onClick={() => deleteNumber(number.id)}
                  className='p-2 hover:bg-red-50 rounded-lg transition-colors'
                >
                  <AlertTriangle className='h-4 w-4 text-red-500' />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-8 text-muted-foreground'>
          <MessageSquare className='h-12 w-12 mx-auto mb-2 opacity-50' />
          <p className='text-sm'>{t('settings.notificationSettings.noNumbersConfigured')}</p>
        </div>
      )}

      <Separator />

      {/* Formulario para agregar número */}
      <div className='space-y-3'>
        <Label className='text-sm font-medium'>{t('settings.notificationSettings.addNumber')}</Label>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <div>
            <input
              type='text'
              placeholder={t('settings.notificationSettings.namePlaceholder')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className='w-full px-3 py-2 border dark:border-zinc-700 rounded-lg text-sm bg-transparent dark:text-zinc-100'
            />
          </div>
          <div>
            <input
              type='tel'
              placeholder={t('settings.notificationSettings.phonePlaceholder')}
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className='w-full px-3 py-2 border dark:border-zinc-700 rounded-lg text-sm bg-transparent dark:text-zinc-100'
            />
          </div>
        </div>
        <button
          onClick={addNumber}
          disabled={adding}
          className='w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
        >
          {adding ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin' />
              {t('settings.notificationSettings.adding')}
            </>
          ) : (
            <>
              <MessageSquare className='h-4 w-4' />
              {t('settings.notificationSettings.addNumber')}
            </>
          )}
        </button>
      </div>

    </div>
  );
}
