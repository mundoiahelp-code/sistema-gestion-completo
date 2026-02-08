'use client';

import { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { API } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
import { Clock, User, Package, CreditCard, MapPin, Check, X, Loader2, Edit, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/i18n/I18nProvider';
import { toast } from 'sonner';
import EditAppointmentModal from './EditAppointmentModal';

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

interface Props {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AppointmentDetailsModal({ appointment, open, onClose, onSuccess }: Props) {
  const { locale } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isEnglish = locale === 'en';

  if (!appointment) return null;

  const handleAttend = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('accessToken');
      await axios.post(`${API}/appointments/${appointment.id}/attend`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(isEnglish ? 'Appointment attended' : 'Turno atendido');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error attending appointment:', error);
      toast.error(error.response?.data?.error || (isEnglish ? 'Error attending appointment' : 'Error al atender turno'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = async () => {
    setLoading(true);
    setShowCancelConfirm(false);
    
    try {
      const token = Cookies.get('accessToken');
      await axios.post(`${API}/appointments/${appointment.id}/cancel`, 
        { cancelReason: 'Cancelado desde detalles' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(isEnglish ? 'Appointment cancelled' : 'Turno cancelado');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      toast.error(error.response?.data?.error || (isEnglish ? 'Error cancelling appointment' : 'Error al cancelar turno'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { label: isEnglish ? 'Pending' : 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
      CONFIRMED: { label: isEnglish ? 'Confirmed' : 'Confirmado', color: 'bg-green-100 text-green-700' },
      ATTENDED: { label: isEnglish ? 'Attended' : 'Atendido', color: 'bg-blue-100 text-blue-700' },
      CANCELLED: { label: isEnglish ? 'Cancelled' : 'Cancelado', color: 'bg-red-100 text-red-700' },
    };
    const badge = badges[status as keyof typeof badges] || badges.PENDING;
    return (
      <span className={`px-3 py-1.5 rounded-md text-sm font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
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

  const canAttend = ['PENDING', 'CONFIRMED'].includes(appointment.status);
  const canCancel = ['PENDING', 'CONFIRMED'].includes(appointment.status);

  // Formatear producto
  let productDisplay = appointment.product || '';
  let imeiDisplay = '';
  
  if (appointment.product) {
    const parts = appointment.product.split(' - IMEI:');
    if (parts.length > 1) {
      const mainInfo = parts[0];
      const imeiAndBattery = parts[1];
      const [imei, battery] = imeiAndBattery.split(' - Batería:');
      productDisplay = `${mainInfo} ${battery?.trim() || ''}`;
      imeiDisplay = imei.trim();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            {isEnglish ? 'Appointment Details' : 'Detalle del turno'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Hora y Estado */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-gray-400" />
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {appointment.time}
            </span>
          </div>
          {getStatusBadge(appointment.status)}
        </div>

        {/* Información */}
        <div className="space-y-4 mb-6">
          {/* Cliente y Teléfono */}
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <div className="text-gray-900 dark:text-white font-medium">
                {appointment.customerName}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {appointment.customerPhone}
              </div>
            </div>
          </div>

          {/* Producto */}
          {appointment.product && (
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-gray-900 dark:text-white">
                  {productDisplay}
                </div>
                {imeiDisplay && (
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    IMEI: {imeiDisplay}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Forma de pago */}
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <span className="text-gray-900 dark:text-white">
              {getPaymentMethodLabel(appointment.paymentMethod)}
            </span>
          </div>

          {/* Sucursal */}
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-gray-400" />
            <span className="text-gray-900 dark:text-white">
              {appointment.store?.name || '-'}
            </span>
          </div>

          {/* Tipo de cliente */}
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-400" />
            <span className="text-blue-600 dark:text-blue-400">
              {getCustomerTypeLabel(appointment.customerType)}
            </span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setShowEditModal(true)}
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEnglish ? 'Edit' : 'Modificar'}
          </Button>
          
          {canAttend && (
            <Button
              onClick={handleAttend}
              disabled={loading}
              className="flex-[2] bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {isEnglish ? 'Attended' : 'Atendido'}
            </Button>
          )}

          {canCancel && (
            <Button
              variant="destructive"
              onClick={handleCancelClick}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>

      {/* Modal de edición */}
      <EditAppointmentModal
        appointment={appointment}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          onSuccess();
        }}
      />

      {/* Confirmación de cancelación */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {isEnglish ? 'Cancel appointment?' : '¿Cancelar turno?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEnglish 
                ? `Are you sure you want to cancel the appointment for ${appointment?.customerName}? This action cannot be undone and the customer will need to schedule a new appointment.`
                : `¿Estás seguro de cancelar el turno de ${appointment?.customerName}? Esta acción no se puede deshacer y el cliente deberá agendar un nuevo turno.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {isEnglish ? 'No, keep it' : 'No, mantener'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelConfirm}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEnglish ? 'Cancelling...' : 'Cancelando...'}
                </>
              ) : (
                <>
                  {isEnglish ? 'Yes, cancel' : 'Sí, cancelar'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
