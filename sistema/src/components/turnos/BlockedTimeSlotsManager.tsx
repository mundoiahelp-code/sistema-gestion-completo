'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n/I18nProvider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api';

interface BlockedSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  storeId?: string;
  store?: { id: string; name: string };
}

interface Store {
  id: string;
  name: string;
}

export default function BlockedTimeSlotsManager() {
  const { locale } = useTranslation();
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
    storeId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = Cookies.get('token') || Cookies.get('accessToken');
      
      // Cargar tiendas
      const storesRes = await axios.get(`${API_URL}/stores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStores(storesRes.data);

      // Cargar horarios bloqueados
      const slotsRes = await axios.get(`${API_URL}/blocked-time-slots`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlockedSlots(slotsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(locale === 'es' ? 'Error al cargar datos' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.date || !formData.startTime || !formData.endTime) {
      toast.error(locale === 'es' ? 'Completá todos los campos requeridos' : 'Fill all required fields');
      return;
    }

    setSaving(true);
    try {
      const token = Cookies.get('token') || Cookies.get('accessToken');
      await axios.post(
        `${API_URL}/blocked-time-slots`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(locale === 'es' ? 'Horario bloqueado exitosamente' : 'Time slot blocked successfully');
      setDialogOpen(false);
      setFormData({ date: '', startTime: '', endTime: '', reason: '', storeId: '' });
      loadData();
    } catch (error) {
      console.error('Error creating blocked slot:', error);
      toast.error(locale === 'es' ? 'Error al bloquear horario' : 'Error blocking time slot');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'es' ? '¿Eliminar este horario bloqueado?' : 'Delete this blocked time slot?')) {
      return;
    }

    try {
      const token = Cookies.get('token') || Cookies.get('accessToken');
      await axios.delete(`${API_URL}/blocked-time-slots/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(locale === 'es' ? 'Horario desbloqueado' : 'Time slot unblocked');
      loadData();
    } catch (error) {
      console.error('Error deleting blocked slot:', error);
      toast.error(locale === 'es' ? 'Error al desbloquear horario' : 'Error unblocking time slot');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-8'>
          <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <AlertCircle className='h-5 w-5' />
                {locale === 'es' ? 'Horarios Bloqueados' : 'Blocked Time Slots'}
              </CardTitle>
              <CardDescription>
                {locale === 'es' 
                  ? 'Bloqueá horarios para que no se puedan agendar turnos' 
                  : 'Block time slots to prevent appointments from being scheduled'}
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className='h-4 w-4 mr-2' />
              {locale === 'es' ? 'Bloquear horario' : 'Block time slot'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {blockedSlots.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              <AlertCircle className='h-12 w-12 mx-auto mb-2 opacity-50' />
              <p>{locale === 'es' ? 'No hay horarios bloqueados' : 'No blocked time slots'}</p>
            </div>
          ) : (
            <div className='space-y-2'>
              {blockedSlots.map((slot) => (
                <div
                  key={slot.id}
                  className='flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors'
                >
                  <div className='flex-1'>
                    <div className='flex items-center gap-4 text-sm'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='h-4 w-4 text-muted-foreground' />
                        <span className='font-medium'>
                          {format(new Date(slot.date), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Clock className='h-4 w-4 text-muted-foreground' />
                        <span>{slot.startTime} - {slot.endTime}</span>
                      </div>
                      {slot.store && (
                        <span className='text-xs bg-muted px-2 py-1 rounded'>
                          {slot.store.name}
                        </span>
                      )}
                    </div>
                    {slot.reason && (
                      <p className='text-xs text-muted-foreground mt-1'>{slot.reason}</p>
                    )}
                  </div>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => handleDelete(slot.id)}
                  >
                    <Trash2 className='h-4 w-4 text-destructive' />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear horario bloqueado */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {locale === 'es' ? 'Bloquear Horario' : 'Block Time Slot'}
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='date'>{locale === 'es' ? 'Fecha' : 'Date'} *</Label>
              <Input
                id='date'
                type='date'
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='startTime'>{locale === 'es' ? 'Hora inicio' : 'Start time'} *</Label>
                <Input
                  id='startTime'
                  type='time'
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='endTime'>{locale === 'es' ? 'Hora fin' : 'End time'} *</Label>
                <Input
                  id='endTime'
                  type='time'
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='storeId'>{locale === 'es' ? 'Sucursal' : 'Store'}</Label>
              <Select
                value={formData.storeId}
                onValueChange={(value) => setFormData({ ...formData, storeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={locale === 'es' ? 'Todas las sucursales' : 'All stores'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>{locale === 'es' ? 'Todas las sucursales' : 'All stores'}</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='reason'>{locale === 'es' ? 'Motivo (opcional)' : 'Reason (optional)'}</Label>
              <Textarea
                id='reason'
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder={locale === 'es' ? 'Ej: Feriado, Evento especial, etc.' : 'E.g: Holiday, Special event, etc.'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              {locale === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                locale === 'es' ? 'Bloquear' : 'Block'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
