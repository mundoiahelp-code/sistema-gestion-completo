'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, User, Package, MapPin, Check, X, RefreshCw, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import Link from 'next/link';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  product?: string;
  productId?: string;
  status: string;
  store?: { name: string };
}

const statusColors: Record<string, string> = {
  CONFIRMED: 'bg-green-500',
  PENDING: 'bg-yellow-500',
  COMPLETED: 'bg-blue-500',
  CANCELLED: 'bg-red-500',
};

const paymentLabels: Record<string, string> = {
  CASH_USD: 'Efectivo USD',
  CASH_ARS: 'Efectivo ARS',
  TRANSFER: 'Transferencia',
  USDT_BINANCE: 'USDT',
};

export default function TodayAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Array<{id: string, name: string, email: string}>>([]);
  
  // Estados del modal
  const [completedOpen, setCompletedOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [completedUserId, setCompletedUserId] = useState('');
  const [completedPaymentMethod, setCompletedPaymentMethod] = useState('CASH_USD');
  const [completedPrice, setCompletedPrice] = useState(0);
  const [completedProduct, setCompletedProduct] = useState<any>(null);
  const [completedLoading, setCompletedLoading] = useState(false);

  useEffect(() => {
    fetchUpcomingAppointments();
    fetchUsers();
    // Actualizar cada 2 minutos
    const interval = setInterval(fetchUpcomingAppointments, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const fetchUpcomingAppointments = async () => {
    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      // Obtener turnos de hoy y mañana
      const [resToday, resTomorrow] = await Promise.all([
        axios.get(`${API}/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { date: todayStr, limit: 20 }
        }),
        axios.get(`${API}/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { date: tomorrowStr, limit: 20 }
        })
      ]);
      
      const todayAppts = (resToday.data.appointments || []).map((a: Appointment) => ({ ...a, isToday: true }));
      const tomorrowAppts = (resTomorrow.data.appointments || []).map((a: Appointment) => ({ ...a, isToday: false }));
      
      // Combinar, filtrar cancelados y atendidos, y ordenar
      const allAppts = [...todayAppts, ...tomorrowAppts]
        .filter((a: Appointment) => a.status !== 'CANCELLED' && a.status !== 'ATTENDED')
        .sort((a: Appointment & { isToday: boolean }, b: Appointment & { isToday: boolean }) => {
          // Primero por día (hoy primero)
          if (a.isToday !== b.isToday) return a.isToday ? -1 : 1;
          // Luego por hora
          return a.time.localeCompare(b.time);
        });
      
      setAppointments(allAppts);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      await axios.patch(`${API}/appointments/${id}`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Turno confirmado');
      fetchUpcomingAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al confirmar turno');
    }
  };

  // Abrir modal de completar
  const openCompletedModal = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setCompletedUserId('');
    setCompletedPaymentMethod('CASH_USD');
    setCompletedPrice(0);
    setCompletedProduct(null);
    setCompletedOpen(true);
  };

  // Confirmar turno completado
  const confirmCompleted = async () => {
    if (!selectedAppointment || !completedUserId || completedPrice <= 0) return;
    
    setCompletedLoading(true);
    try {
      const token = Cookies.get('accessToken') || Cookies.get('token');
      await axios.post(`${API}/appointments/${selectedAppointment.id}/attend`, 
        { 
          assignedUserId: completedUserId,
          paymentMethod: completedPaymentMethod,
          salePrice: completedPrice
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCompletedOpen(false);
      fetchUpcomingAppointments();
      toast.success('Turno marcado como atendido y venta registrada');
    } catch (error) {
      console.error('Error confirming appointment:', error);
      toast.error('Error al confirmar turno');
    } finally {
      setCompletedLoading(false);
    }
  };

  // Determinar si un turno ya pasó
  const isPast = (time: string) => {
    const now = new Date();
    const [h, m] = time.split(':').map(Number);
    const appointmentTime = new Date();
    appointmentTime.setHours(h, m, 0, 0);
    return now > appointmentTime;
  };

  // Próximo turno (el primero que no pasó y no está atendido)
  const nextAppointment = appointments.find(a => 
    !isPast(a.time) && a.status !== 'ATTENDED'
  );

  if (loading) {
    return (
      <Card className="bg-white dark:bg-zinc-900 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3"></div>
          <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-purple-500" />
          <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Próximos Turnos
          </h3>
        </div>
        <Link href="/turnos">
          <span className="text-xs text-purple-500 hover:text-purple-400 cursor-pointer">
            Ver todos →
          </span>
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-6 text-zinc-400">
          <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay turnos próximos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Contador */}
          <div className="flex items-center gap-4 mb-3 text-sm">
            <span className="text-zinc-500">
              <span className="text-lg font-bold text-zinc-900 dark:text-white">{appointments.length}</span> turnos
            </span>
            <span className="text-blue-500">
              {appointments.filter(a => a.status === 'CONFIRMED').length} confirmados
            </span>
            <span className="text-yellow-500">
              {appointments.filter(a => a.status === 'PENDING').length} pendientes
            </span>
          </div>

          {/* Lista de turnos */}
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {appointments.map((apt: any) => {
              const isNext = apt.id === nextAppointment?.id;
              const past = apt.isToday && isPast(apt.time) && apt.status !== 'ATTENDED';
              const isTomorrow = !apt.isToday;
              
              return (
                <div 
                  key={apt.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isNext 
                      ? 'bg-purple-500/10 border-purple-500/50' 
                      : apt.status === 'ATTENDED'
                        ? 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 opacity-60'
                        : past
                          ? 'bg-red-500/10 border-red-500/30'
                          : isTomorrow
                            ? 'bg-blue-500/5 border-blue-500/20'
                            : 'bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Hora */}
                      <div className="text-center">
                        {isTomorrow ? (
                          <div className="text-[10px] text-blue-500 font-medium -mb-0.5">MAÑANA</div>
                        ) : apt.isToday && (
                          <div className="text-[10px] text-purple-500 font-medium -mb-0.5">HOY</div>
                        )}
                        <div className={`text-lg font-mono font-bold ${
                          isNext ? 'text-purple-500' : 
                          apt.status === 'ATTENDED' ? 'text-zinc-400' :
                          past ? 'text-red-500' : 
                          isTomorrow ? 'text-blue-500' : 'text-zinc-900 dark:text-white'
                        }`}>
                          {apt.time}
                        </div>
                      </div>
                      
                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium text-sm ${
                            apt.status === 'ATTENDED' ? 'text-zinc-400' : 'text-zinc-900 dark:text-white'
                          }`}>
                            {apt.customerName}
                          </span>
                          {isNext && (
                            <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded">
                              PRÓXIMO
                            </span>
                          )}
                          {past && apt.status !== 'ATTENDED' && (
                            <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded">
                              ATRASADO
                            </span>
                          )}
                        </div>
                        {apt.product && (
                          <div className="text-xs text-zinc-500 flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {apt.product}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Acciones */}
                    {apt.status !== 'ATTENDED' && apt.isToday && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                        onClick={() => openCompletedModal(apt)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {apt.status === 'ATTENDED' && (
                      <span className="text-xs text-green-500">✓ Atendido</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de completar turno */}
      <Dialog open={completedOpen} onOpenChange={setCompletedOpen}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar como atendido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Detalles del producto */}
            {selectedAppointment?.product && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{selectedAppointment.product}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <Label>Atendido por</Label>
              <Select value={completedUserId} onValueChange={setCompletedUserId}>
                <SelectTrigger className="mt-1 dark:bg-zinc-800">
                  <SelectValue placeholder="Elegí vendedor..." />
                </SelectTrigger>
                <SelectContent>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Método de pago</Label>
              <Select value={completedPaymentMethod} onValueChange={setCompletedPaymentMethod}>
                <SelectTrigger className="mt-1 dark:bg-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH_USD">Efectivo USD</SelectItem>
                  <SelectItem value="CASH_ARS">Efectivo ARS</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  <SelectItem value="USDT_BINANCE">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Precio de venta</Label>
              <Input
                type="number"
                value={completedPrice || ''}
                onChange={(e) => setCompletedPrice(e.target.value === '' ? 0 : Number(e.target.value))}
                className="mt-1 dark:bg-zinc-800"
                placeholder="Ingresá el precio"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletedOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700" 
              onClick={confirmCompleted} 
              disabled={completedLoading || !completedUserId || completedPrice <= 0}
            >
              {completedLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Confirmar venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

