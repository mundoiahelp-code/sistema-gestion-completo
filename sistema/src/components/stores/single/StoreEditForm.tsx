'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BuildingIcon,
  LoaderCircleIcon,
  StoreIcon,
  WarehouseIcon,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from '@/i18n/I18nProvider';

interface StoreData {
  name: string;
  icon: string;
  address?: string;
  phone?: string;
  mondayHours?: string | null;
  tuesdayHours?: string | null;
  wednesdayHours?: string | null;
  thursdayHours?: string | null;
  fridayHours?: string | null;
  saturdayHours?: string | null;
  sundayHours?: string | null;
  appointmentDuration?: number;
  googleMapsUrl?: string | null;
}

interface Props {
  handleEdit: (data: StoreData) => void;
  loading: boolean;
  data: StoreData;
  onCancel?: () => void;
}

const DAYS = [
  { key: 'mondayHours', label: 'Lunes' },
  { key: 'tuesdayHours', label: 'Martes' },
  { key: 'wednesdayHours', label: 'Miércoles' },
  { key: 'thursdayHours', label: 'Jueves' },
  { key: 'fridayHours', label: 'Viernes' },
  { key: 'saturdayHours', label: 'Sábado' },
  { key: 'sundayHours', label: 'Domingo' },
];

export default function StoreEditForm({ handleEdit, loading, data, onCancel }: Props) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<StoreData>(data);
  const [dayEnabled, setDayEnabled] = useState<Record<string, boolean>>({});

  const iconsList = [
    { value: 'store', icon: StoreIcon },
    { value: 'building', icon: BuildingIcon },
    { value: 'warehouse', icon: WarehouseIcon },
  ];

  useEffect(() => {
    const enabled: Record<string, boolean> = {};
    DAYS.forEach(day => {
      const value = data[day.key as keyof StoreData];
      enabled[day.key] = !!value && value !== null;
    });
    setDayEnabled(enabled);
    setFormData(data);
  }, [data]);

  const updateField = (field: keyof StoreData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleDay = (dayKey: string, enabled: boolean) => {
    setDayEnabled(prev => ({ ...prev, [dayKey]: enabled }));
    if (!enabled) {
      updateField(dayKey as keyof StoreData, null);
    } else {
      const defaultHours = dayKey === 'saturdayHours' ? '09:00-17:00' : 
                          dayKey === 'sundayHours' ? null : '09:00-19:00';
      updateField(dayKey as keyof StoreData, defaultHours);
    }
  };

  const updateDayHours = (dayKey: string, type: 'open' | 'close', value: string) => {
    const current = formData[dayKey as keyof StoreData] as string || '09:00-19:00';
    const [openTime, closeTime] = current.split('-');
    const newValue = type === 'open' ? `${value}-${closeTime}` : `${openTime}-${value}`;
    updateField(dayKey as keyof StoreData, newValue);
  };

  const getHours = (dayKey: string): { open: string; close: string } => {
    const value = formData[dayKey as keyof StoreData] as string;
    if (!value) return { open: '09:00', close: '19:00' };
    const [open, close] = value.split('-');
    return { open: open || '09:00', close: close || '19:00' };
  };

  const applyToWeekdays = () => {
    const mondayHours = formData.mondayHours;
    if (mondayHours) {
      setFormData(prev => ({
        ...prev,
        tuesdayHours: mondayHours,
        wednesdayHours: mondayHours,
        thursdayHours: mondayHours,
        fridayHours: mondayHours,
      }));
      setDayEnabled(prev => ({
        ...prev,
        tuesdayHours: true,
        wednesdayHours: true,
        thursdayHours: true,
        fridayHours: true,
      }));
    }
  };

  return (
    <div className='space-y-4'>
      <Tabs defaultValue='general' className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='general'>General</TabsTrigger>
          <TabsTrigger value='horarios'>Horarios</TabsTrigger>
          <TabsTrigger value='turnos'>Turnos</TabsTrigger>
        </TabsList>

        <TabsContent value='general' className='space-y-4 mt-4 min-h-[400px]'>
          <div>
            <Label className='text-xs'>Nombre</Label>
            <Input 
              value={formData.name} 
              onChange={(e) => updateField('name', e.target.value)} 
            />
          </div>
          
          <div>
            <Label className='text-xs'>Dirección</Label>
            <Input 
              value={formData.address || ''} 
              onChange={(e) => updateField('address', e.target.value)}
              placeholder='Ej: Av. Mitre 1234, Adrogue'
            />
          </div>

          <div>
            <Label className='text-xs'>Teléfono</Label>
            <Input 
              value={formData.phone || ''} 
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder='Ej: 1155667788'
            />
          </div>

          <div>
            <Label className='text-xs'>Link de Google Maps</Label>
            <Input 
              value={formData.googleMapsUrl || ''} 
              onChange={(e) => updateField('googleMapsUrl', e.target.value)}
              placeholder='https://maps.google.com/...'
            />
          </div>

          <div>
            <Label className='text-xs'>Icono</Label>
            <RadioGroup
              className='flex items-center gap-2 mt-1'
              value={formData.icon}
              onValueChange={(v) => updateField('icon', v)}
            >
              {iconsList.map((item, i) => (
                <Label
                  key={i}
                  htmlFor={`icon-${i}`}
                  className={twMerge(
                    formData.icon === item.value
                      ? 'bg-zinc-700 text-white'
                      : 'bg-zinc-100 text-zinc-700',
                    'p-2 rounded-lg cursor-pointer hover:opacity-80'
                  )}
                >
                  <RadioGroupItem
                    value={item.value}
                    id={`icon-${i}`}
                    className='hidden'
                  />
                  <item.icon className='stroke-1 h-5 w-5' />
                </Label>
              ))}
            </RadioGroup>
          </div>
        </TabsContent>

        <TabsContent value='horarios' className='space-y-3 mt-4 min-h-[400px]'>
          <div className='flex justify-between items-center mb-2'>
            <p className='text-sm text-zinc-500'>Configurá los horarios de atención</p>
            <Button 
              variant='outline' 
              size='sm'
              onClick={applyToWeekdays}
              className='text-xs'
            >
              Copiar Lunes a L-V
            </Button>
          </div>

          {DAYS.map((day) => {
            const hours = getHours(day.key);
            const isEnabled = dayEnabled[day.key];
            
            return (
              <div key={day.key} className='flex items-center gap-3 py-2 border-b'>
                <div className='w-24'>
                  <span className={twMerge(
                    'text-sm font-medium',
                    !isEnabled && 'text-zinc-400'
                  )}>
                    {day.label}
                  </span>
                </div>
                
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => toggleDay(day.key, checked)}
                />
                
                {isEnabled ? (
                  <div className='flex items-center gap-2 flex-1'>
                    <Input
                      type='time'
                      value={hours.open}
                      onChange={(e) => updateDayHours(day.key, 'open', e.target.value)}
                      className='w-28'
                    />
                    <span className='text-zinc-400'>a</span>
                    <Input
                      type='time'
                      value={hours.close}
                      onChange={(e) => updateDayHours(day.key, 'close', e.target.value)}
                      className='w-28'
                    />
                  </div>
                ) : (
                  <span className='text-sm text-zinc-400'>Cerrado</span>
                )}
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value='turnos' className='space-y-4 mt-4 min-h-[400px]'>
          <div>
            <Label className='text-xs'>Duración de turnos (minutos)</Label>
            <div className='flex gap-2 mt-1'>
              {[15, 30, 45, 60].map((mins) => (
                <Button
                  key={mins}
                  type='button'
                  variant={formData.appointmentDuration === mins ? 'default' : 'outline'}
                  size='sm'
                  onClick={() => updateField('appointmentDuration', mins)}
                >
                  {mins} min
                </Button>
              ))}
            </div>
            <p className='text-xs text-zinc-500 mt-1'>
              Los turnos se ofrecerán cada {formData.appointmentDuration || 15} minutos
            </p>
          </div>

          <div className='mt-6 p-4 bg-zinc-50 rounded-lg border'>
            <h4 className='text-sm font-medium mb-2'>¿Cómo funcionan los turnos?</h4>
            <ul className='text-xs text-zinc-600 space-y-2'>
              <li>• Los clientes podrán reservar turnos en los horarios configurados</li>
              <li>• La duración determina cada cuánto tiempo se puede agendar un turno</li>
              <li>• Los turnos solo estarán disponibles en los días y horarios de atención</li>
              <li>• Podés ver y gestionar los turnos desde la sección "Turnos" del menú</li>
            </ul>
          </div>

          <div className='mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200'>
            <h4 className='text-sm font-medium text-blue-900 mb-2'>💡 Recomendación</h4>
            <p className='text-xs text-blue-700'>
              Para reparaciones y servicios técnicos, recomendamos turnos de 30-45 minutos. 
              Para ventas y consultas rápidas, 15 minutos suele ser suficiente.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className='flex justify-end gap-2 pt-4 border-t'>
        {onCancel && (
          <Button variant='outline' onClick={onCancel}>
            {t('common.cancel')}
          </Button>
        )}
        <Button
          type='button'
          disabled={loading}
          onClick={() => handleEdit(formData)}
        >
          {loading ? (
            <LoaderCircleIcon className='stroke-1 h-5 w-5 animate-spin' />
          ) : (
            t('common.save')
          )}
        </Button>
      </div>
    </div>
  );
}
