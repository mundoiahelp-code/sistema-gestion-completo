'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, Search, Plus, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/i18n/I18nProvider';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import CreateAppointmentModal from '@/components/appointments/CreateAppointmentModal';
import AppointmentDetailsModal from '@/components/appointments/AppointmentDetailsModal';

interface Appointment {
  id: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  product?: string;
  status: string;
  notes?: string;
  store?: { name: string };
  paymentMethod?: string;
  customerType?: string;
}

export default function TurnosPage() {
  const { t, locale } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [stores, setStores] = useState<any[]>([]);
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isEnglish = locale === 'en';

  useEffect(() => {
    loadAppointments();
    loadStores();
  }, [statusFilter, storeFilter]);

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

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('accessToken');
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (storeFilter !== 'all') params.append('storeId', storeFilter);
      if (search) params.append('search', search);

      const res = await axios.get(`${API}/appointments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setAppointments(res.data.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadAppointments();
  };

  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: es });
    } catch {
      return dateStr;
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    const labels: Record<string, string> = {
      CASH_USD: 'Efectivo USD',
      CASH_ARS: 'Efectivo ARS',
      TRANSFER: 'Transferencia',
      USDT_BINANCE: 'USDT',
      EFECTIVO: 'Efectivo USD',
    };
    return labels[method || 'CASH_USD'] || method || 'Efectivo USD';
  };

  const getCustomerTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      MINORISTA: 'Minorista',
      MAYORISTA: 'Mayorista',
      MIXTO: 'Mixto',
    };
    return labels[type || 'MINORISTA'] || 'Minorista';
  };

  const handleSelectAppointment = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAppointments(prev => [...prev, id]);
    } else {
      setSelectedAppointments(prev => prev.filter(appointmentId => appointmentId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAppointments(displayedAppointments.map(a => a.id));
    } else {
      setSelectedAppointments([]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedAppointments.length === 0) return;
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    
    try {
      const token = Cookies.get('accessToken');
      
      // Eliminar cada turno seleccionado
      await Promise.all(
        selectedAppointments.map(id =>
          axios.delete(`${API}/appointments/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );

      toast.success(
        isEnglish 
          ? `${selectedAppointments.length} appointment(s) deleted successfully`
          : `${selectedAppointments.length} turno(s) eliminado(s) exitosamente`
      );
      
      setSelectedAppointments([]);
      loadAppointments();
    } catch (error) {
      console.error('Error deleting appointments:', error);
      toast.error(
        isEnglish 
          ? 'Error deleting appointments'
          : 'Error al eliminar turnos'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrar turnos activos vs historial
  const activeAppointments = appointments.filter(a => ['PENDING', 'CONFIRMED'].includes(a.status));
  const historyAppointments = appointments.filter(a => ['ATTENDED', 'CANCELLED'].includes(a.status));

  // Ordenar historial: más nuevos arriba (invertir orden)
  const sortedHistoryAppointments = [...historyAppointments].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateB.getTime() - dateA.getTime(); // Más nuevos primero
  });

  const displayedAppointments = activeTab === 'active' ? activeAppointments : sortedHistoryAppointments;

  // Contadores
  const totalCount = activeAppointments.length;
  const pendingCount = activeAppointments.filter(a => a.status === 'PENDING').length;
  const attendedCount = historyAppointments.filter(a => a.status === 'ATTENDED').length;
  const cancelledCount = historyAppointments.filter(a => a.status === 'CANCELLED').length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isEnglish ? 'Appointments' : 'Turnos'}</h1>
          <p className="text-sm text-gray-500">{isEnglish ? 'Appointment management' : 'Gestión de turnos agendados'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAppointments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {isEnglish ? 'Refresh' : 'Actualizar'}
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="bg-black hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            {isEnglish ? 'New' : 'Nuevo'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-zinc-800">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-black text-black dark:border-white dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-2" />
            {isEnglish ? 'Active Appointments' : 'Turnos Activos'}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-black text-black dark:border-white dark:text-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {isEnglish ? `History (${historyAppointments.length})` : `Historial (${historyAppointments.length})`}
          </button>
        </div>
      </div>

      {/* Filtros y botón de eliminar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={isEnglish ? 'Search by name, phone or product...' : 'Buscar por nombre, teléfono o producto...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Select value={storeFilter} onValueChange={setStoreFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isEnglish ? 'All stores' : 'Todas las sucursales'}</SelectItem>
            {stores.map(store => (
              <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isEnglish ? 'All' : 'Todos'}</SelectItem>
            <SelectItem value="PENDING">{isEnglish ? 'Pending' : 'Pendientes'}</SelectItem>
            <SelectItem value="CONFIRMED">{isEnglish ? 'Confirmed' : 'Confirmados'}</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Botón de eliminar - solo visible en historial con selección */}
        {activeTab === 'history' && selectedAppointments.length > 0 && (
          <Button 
            variant="destructive" 
            onClick={handleDeleteSelected}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            {isEnglish 
              ? `Delete (${selectedAppointments.length})`
              : `Eliminar (${selectedAppointments.length})`}
          </Button>
        )}
      </div>

      {/* Cards de contadores */}
      {activeTab === 'active' && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border dark:border-zinc-800">
            <div className="text-sm text-gray-500 mb-1">{isEnglish ? 'Total' : 'Total'}</div>
            <div className="text-3xl font-bold">{totalCount}</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="text-sm text-yellow-700 dark:text-yellow-400 mb-1">{isEnglish ? 'Pending' : 'Pendientes'}</div>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-500">{pendingCount}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-700 dark:text-blue-400 mb-1">{isEnglish ? 'Attended' : 'Atendidos'}</div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">{attendedCount}</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-sm text-red-700 dark:text-red-400 mb-1">{isEnglish ? 'Cancelled' : 'Cancelados'}</div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-500">{cancelledCount}</div>
          </div>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : displayedAppointments.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border dark:border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-zinc-800 border-b dark:border-zinc-700">
              <tr>
                <th className="w-12 px-4 py-3">
                  {activeTab === 'history' && (
                    <input 
                      type="checkbox" 
                      className="rounded"
                      checked={selectedAppointments.length === displayedAppointments.length && displayedAppointments.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  )}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">
                  {isEnglish ? 'Date' : 'Fecha'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">
                  {isEnglish ? 'Time' : 'Hora'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">
                  {isEnglish ? 'Name' : 'Nombre'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">
                  {isEnglish ? 'Phone' : 'Teléfono'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">
                  {isEnglish ? 'Product' : 'Producto'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">
                  {isEnglish ? 'Payment' : 'Pago'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">
                  {isEnglish ? 'Type' : 'Tipo'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">
                  {isEnglish ? 'Store' : 'Sucursal'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase">
                  {isEnglish ? 'Status' : 'Estado'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {displayedAppointments.map((appointment) => (
                <tr 
                  key={appointment.id} 
                  className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer"
                  onClick={() => handleViewDetails(appointment)}
                >
                  <td className="px-4 py-3">
                    {activeTab === 'history' ? (
                      <input 
                        type="checkbox" 
                        className="rounded"
                        checked={selectedAppointments.includes(appointment.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectAppointment(appointment.id, e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <input type="checkbox" className="rounded opacity-0 pointer-events-none" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{formatDate(appointment.date)}</td>
                  <td className="px-4 py-3 text-sm font-medium">{appointment.time}</td>
                  <td className="px-4 py-3 text-sm">{appointment.customerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{appointment.customerPhone}</td>
                  <td className="px-4 py-3 text-sm">{appointment.product?.split(' - IMEI:')[0] || '-'}</td>
                  <td className="px-4 py-3 text-sm">{getPaymentMethodLabel(appointment.paymentMethod)}</td>
                  <td className="px-4 py-3 text-sm">
                    {getCustomerTypeLabel(appointment.customerType)}
                  </td>
                  <td className="px-4 py-3 text-sm">{appointment.store?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      appointment.status === 'ATTENDED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {appointment.status === 'CONFIRMED' ? (isEnglish ? 'Confirmed' : 'Confirmado') :
                       appointment.status === 'PENDING' ? (isEnglish ? 'Pending' : 'Pendiente') :
                       appointment.status === 'ATTENDED' ? (isEnglish ? 'Attended' : 'Atendido') :
                       (isEnglish ? 'Cancelled' : 'Cancelado')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border dark:border-zinc-800">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {isEnglish ? 'No appointments' : 'No hay turnos'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {activeTab === 'active' 
              ? (isEnglish ? 'No active appointments found' : 'No se encontraron turnos activos')
              : (isEnglish ? 'No history found' : 'No hay historial')}
          </p>
        </div>
      )}

      {/* Modales */}
      <CreateAppointmentModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadAppointments}
      />
      
      <AppointmentDetailsModal
        appointment={selectedAppointment}
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedAppointment(null);
        }}
        onSuccess={loadAppointments}
      />

      {/* Confirmación de eliminación */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {isEnglish ? 'Delete appointments?' : '¿Eliminar turnos?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEnglish 
                ? `Are you sure you want to permanently delete ${selectedAppointments.length} appointment(s)? This action cannot be undone and all appointment data will be lost.`
                : `¿Estás seguro de eliminar permanentemente ${selectedAppointments.length} turno(s)? Esta acción no se puede deshacer y se perderán todos los datos de los turnos.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {isEnglish ? 'Cancel' : 'Cancelar'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {isEnglish ? 'Deleting...' : 'Eliminando...'}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isEnglish ? 'Yes, delete' : 'Sí, eliminar'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
