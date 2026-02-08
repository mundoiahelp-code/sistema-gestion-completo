'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n/I18nProvider';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  product?: string;
  status: string;
  notes?: string;
  storeId?: string;
}

interface Store {
  id: string;
  name: string;
  mondayHours?: string;
  tuesdayHours?: string;
  wednesdayHours?: string;
  thursdayHours?: string;
  fridayHours?: string;
  saturdayHours?: string;
  sundayHours?: string;
  appointmentDuration?: number;
}

interface Props {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditAppointmentModal({ appointment, open, onClose, onSuccess }: Props) {
  const { locale } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [showAvailableTimesModal, setShowAvailableTimesModal] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [occupiedTimes, setOccupiedTimes] = useState<string[]>([]);
  const [selectedStoreForTimes, setSelectedStoreForTimes] = useState<string>('');
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    customerName: '',
    customerPhone: '',
    notes: '',
  });

  const isEnglish = locale === 'en';

  useEffect(() => {
    if (open) {
      loadStores();
    }
  }, [open]);

  useEffect(() => {
    if (appointment && open) {
      // Parsear fecha correctamente sin problemas de zona horaria
      const dateStr = appointment.date;
      let formattedDate = '';
      
      if (dateStr.includes('T')) {
        // Si viene con hora (ISO), extraer solo la fecha
        formattedDate = dateStr.split('T')[0];
      } else if (dateStr.includes('-')) {
        // Si ya está en formato YYYY-MM-DD
        formattedDate = dateStr;
      } else {
        // Intentar parsear como fecha normal
        const dateObj = new Date(dateStr);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      }
      
      setFormData({
        date: formattedDate,
        time: appointment.time,
        customerName: appointment.customerName,
        customerPhone: appointment.customerPhone,
        notes: appointment.notes || '',
      });
    }
  }, [appointment, open]);

  const loadStores = async () => {
    try {
      const token = Cookies.get('accessToken');
      const res = await axios.get(`${API}/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStores(res.data.stores || []);
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const openAvailableTimesModal = () => {
    if (!formData.date) {
      toast.error(isEnglish ? 'Select date first' : 'Seleccioná la fecha primero');
      return;
    }
    setShowAvailableTimesModal(true);
  };

  const generateAvailableTimes = async (storeId: string) => {
    if (!formData.date || !storeId) return;

    const selectedStore = stores.find(s => s.id === storeId);
    if (!selectedStore) return;

    // Parsear fecha correctamente sin problemas de zona horaria
    const [year, month, day] = formData.date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const dayOfWeek = selectedDate.getDay();
    const dayNames = ['sundayHours', 'mondayHours', 'tuesdayHours', 'wednesdayHours', 'thursdayHours', 'fridayHours', 'saturdayHours'];
    const dayHours = selectedStore[dayNames[dayOfWeek] as keyof Store] as string | undefined;

    if (!dayHours || dayHours === 'Cerrado' || dayHours === 'Closed') {
      toast.error(isEnglish ? 'Store is closed on this day' : 'La sucursal está cerrada este día');
      setAvailableTimes([]);
      return;
    }

    if (!dayHours.includes('-')) {
      toast.error(isEnglish ? 'Invalid store hours format' : 'Formato de horarios inválido');
      setAvailableTimes([]);
      return;
    }

    const parts = dayHours.split('-').map((p: string) => p.trim());
    const openTime = parts[0];
    const closeTime = parts[1];
    
    if (!openTime || !closeTime || !openTime.includes(':') || !closeTime.includes(':')) {
      toast.error(isEnglish ? 'Invalid store hours format' : 'Formato de horarios inválido');
      setAvailableTimes([]);
      return;
    }

    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);

    if (isNaN(openHour) || isNaN(openMinute) || isNaN(closeHour) || isNaN(closeMinute)) {
      toast.error(isEnglish ? 'Invalid store hours' : 'Horarios inválidos');
      setAvailableTimes([]);
      return;
    }

    const duration = selectedStore.appointmentDuration || 45;
    const times: string[] = [];
    let currentHour = openHour;
    let currentMinute = openMinute;

    // Si es hoy, filtrar horarios que ya pasaron
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(year, month - 1, day);
    
    let minTimeInMinutes = 0;
    
    if (selectedDay.getTime() === today.getTime()) {
      const currentHourNow = now.getHours();
      const currentMinuteNow = now.getMinutes();
      minTimeInMinutes = currentHourNow * 60 + currentMinuteNow;
    }

    while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      
      if (selectedDay.getTime() === today.getTime()) {
        const slotStartInMinutes = currentHour * 60 + currentMinute;
        const slotEndInMinutes = slotStartInMinutes + duration;
        
        if (minTimeInMinutes < slotEndInMinutes) {
          times.push(timeStr);
        }
      } else {
        times.push(timeStr);
      }

      currentMinute += duration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    setAvailableTimes(times);

    // Obtener turnos ocupados
    try {
      const token = Cookies.get('accessToken');
      const res = await axios.get(`${API}/appointments?date=${formData.date}&storeId=${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const occupied = res.data.appointments
        .filter((apt: any) => apt.status !== 'CANCELLED' && apt.id !== appointment?.id) // Excluir el turno actual
        .map((apt: any) => apt.time);
      setOccupiedTimes(occupied);
    } catch (error) {
      console.error('Error loading occupied times:', error);
      setOccupiedTimes([]);
    }
  };

  const selectTime = (time: string) => {
    setFormData(prev => ({ ...prev, time }));
    setShowAvailableTimesModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appointment) return;

    setLoading(true);
    try {
      const token = Cookies.get('accessToken');
      
      // Convertir fecha a formato ISO con hora local para evitar problemas de zona horaria
      const [year, month, day] = formData.date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day, 12, 0, 0); // Usar mediodía para evitar cambios de día
      
      const payload = {
        ...formData,
        date: dateObj.toISOString(),
      };
      
      await axios.patch(`${API}/appointments/${appointment.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(isEnglish ? 'Appointment updated' : 'Turno actualizado');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast.error(error.response?.data?.error || (isEnglish ? 'Error updating appointment' : 'Error al actualizar turno'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEnglish ? 'Edit Appointment' : 'Editar Turno'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{isEnglish ? 'Date' : 'Fecha'} *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>{isEnglish ? 'Time' : 'Hora'} *</Label>
                <div className="flex gap-2">
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openAvailableTimesModal}
                    className="px-3"
                    title={isEnglish ? 'Available times' : 'Horarios disponibles'}
                  >
                    Disp
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <Label>{isEnglish ? 'Customer Name' : 'Nombre del Cliente'} *</Label>
              <Input
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>{isEnglish ? 'Phone' : 'Teléfono'} *</Label>
              <Input
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                {isEnglish ? 'Cancel' : 'Cancelar'}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEnglish ? 'Save Changes' : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Horarios Disponibles */}
      <Dialog open={showAvailableTimesModal} onOpenChange={setShowAvailableTimesModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEnglish ? 'Available Times' : 'Horarios Disponibles'}</DialogTitle>
            <DialogDescription>
              {formData.date && (() => {
                const [year, month, day] = formData.date.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                return date.toLocaleDateString('es-AR', { 
                  weekday: 'long', 
                  day: '2-digit', 
                  month: 'long'
                });
              })()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-gray-600">{isEnglish ? 'Store' : 'Sucursal'}</Label>
              <Select 
                value={selectedStoreForTimes} 
                onValueChange={(v) => {
                  setSelectedStoreForTimes(v);
                  generateAvailableTimes(v);
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={isEnglish ? 'Select store' : 'Seleccionar sucursal'} />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStoreForTimes && availableTimes.length > 0 && (
              <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-2 bg-zinc-50 dark:bg-zinc-900 border rounded-lg">
                {availableTimes.map((time) => {
                  const isOccupied = occupiedTimes.includes(time);
                  return (
                    <Button
                      key={time}
                      variant={isOccupied ? 'outline' : 'default'}
                      onClick={() => !isOccupied && selectTime(time)}
                      disabled={isOccupied}
                      className={`${isOccupied ? 'line-through opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                      size="sm"
                    >
                      {time}
                    </Button>
                  );
                })}
              </div>
            )}

            {selectedStoreForTimes && availableTimes.length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                {isEnglish ? 'No available times' : 'No hay horarios disponibles'}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
