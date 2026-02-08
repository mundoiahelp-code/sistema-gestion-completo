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
import { Loader2, Plus, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/i18n/I18nProvider';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  model?: string;
  storage?: string;
  color?: string;
  imei?: string;
  battery?: number;
  category: string;
  price: number;
  stock: number;
  reserved: number;
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
  appointmentBuffer?: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAppointmentModal({ open, onClose, onSuccess }: Props) {
  const { locale } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [category, setCategory] = useState<'PHONE' | 'ACCESSORY'>('PHONE');
  const [showReservedAlert, setShowReservedAlert] = useState(false);
  const [pendingProductId, setPendingProductId] = useState<string>('');
  const [showAvailableTimesModal, setShowAvailableTimesModal] = useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [occupiedTimes, setOccupiedTimes] = useState<string[]>([]);
  const [selectedStoreForTimes, setSelectedStoreForTimes] = useState<string>('');
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    date: '',
    time: '',
    productId: '',
    paymentMethods: [{ method: 'CASH_USD' }] as { method: string }[],
    customerType: 'MINORISTA',
    storeId: '',
  });

  const isEnglish = locale === 'en';

  useEffect(() => {
    if (open) {
      loadStores();
      loadProducts();
    }
  }, [open]);

  useEffect(() => {
    if (open && category) {
      loadProducts();
    }
  }, [category, open]);

  const loadStores = async () => {
    try {
      const token = Cookies.get('accessToken');
      const res = await axios.get(`${API}/stores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStores(res.data.stores || []);
      if (res.data.stores?.length > 0) {
        setFormData(prev => ({ ...prev, storeId: res.data.stores[0].id }));
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const token = Cookies.get('accessToken');
      const res = await axios.get(`${API}/products?active=true&category=${category}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.products || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleProductChange = (productId: string) => {
    // Verificar si el producto seleccionado está reservado
    const selectedProduct = products.find(p => p.id === productId);
    if (selectedProduct && selectedProduct.reserved > 0 && selectedProduct.stock === selectedProduct.reserved) {
      // Mostrar alerta profesional
      setPendingProductId(productId);
      setShowReservedAlert(true);
    } else {
      // Producto no reservado, seleccionar directamente
      setFormData({ ...formData, productId });
    }
  };

  const handleConfirmReserved = () => {
    setFormData({ ...formData, productId: pendingProductId });
    setShowReservedAlert(false);
    setPendingProductId('');
  };

  const handleCancelReserved = () => {
    setShowReservedAlert(false);
    setPendingProductId('');
  };

  // Abrir modal de horarios disponibles
  const openAvailableTimesModal = () => {
    if (!formData.date) {
      toast.error(isEnglish ? 'Select date first' : 'Seleccioná la fecha primero');
      return;
    }
    setShowAvailableTimesModal(true);
  };

  // Generar horarios disponibles según configuración de la sucursal
  const generateAvailableTimes = async (storeId: string) => {
    if (!formData.date || !storeId) return;

    const selectedStore = stores.find(s => s.id === storeId);
    if (!selectedStore) return;

    // Parsear fecha correctamente sin problemas de zona horaria
    // formData.date viene en formato "YYYY-MM-DD"
    const [year, month, day] = formData.date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day); // month - 1 porque los meses en JS van de 0-11
    const dayOfWeek = selectedDate.getDay();
    const dayNames = ['sundayHours', 'mondayHours', 'tuesdayHours', 'wednesdayHours', 'thursdayHours', 'fridayHours', 'saturdayHours'];
    const dayHours = selectedStore[dayNames[dayOfWeek] as keyof Store] as string | undefined;

    console.log('=== DEBUG HORARIOS ===');
    console.log('Store completa:', selectedStore);
    console.log('Store name:', selectedStore.name);
    console.log('Day of week:', dayOfWeek, '(' + dayNames[dayOfWeek] + ')');
    console.log('Day hours raw:', dayHours);
    console.log('Type of dayHours:', typeof dayHours);

    if (!dayHours || dayHours === 'Cerrado' || dayHours === 'Closed') {
      toast.error(isEnglish ? 'Store is closed on this day' : 'La sucursal está cerrada este día');
      setAvailableTimes([]);
      return;
    }

    // Validar que dayHours tenga el formato correcto (puede ser "09:00 - 18:00" o "09:00-18:00")
    if (!dayHours.includes('-')) {
      console.error('ERROR: No contiene guión. dayHours:', dayHours);
      toast.error(isEnglish ? 'Invalid store hours format' : 'Formato de horarios inválido');
      setAvailableTimes([]);
      return;
    }

    // Parsear horarios de apertura y cierre (soportar con o sin espacios)
    const parts = dayHours.split('-').map((p: string) => p.trim());
    console.log('Parts after split:', parts);
    const openTime = parts[0];
    const closeTime = parts[1];
    console.log('Open time:', openTime, 'Close time:', closeTime);
    
    if (!openTime || !closeTime || !openTime.includes(':') || !closeTime.includes(':')) {
      console.error('ERROR: Formato inválido - openTime:', openTime, 'closeTime:', closeTime);
      toast.error(isEnglish ? 'Invalid store hours format' : 'Formato de horarios inválido');
      setAvailableTimes([]);
      return;
    }

    const [openHour, openMinute] = openTime.split(':').map(Number);
    const [closeHour, closeMinute] = closeTime.split(':').map(Number);
    console.log('Parsed numbers - Open:', openHour, ':', openMinute, 'Close:', closeHour, ':', closeMinute);

    // Validar que los números sean válidos
    if (isNaN(openHour) || isNaN(openMinute) || isNaN(closeHour) || isNaN(closeMinute)) {
      console.error('ERROR: Números inválidos - open:', openHour, openMinute, 'close:', closeHour, closeMinute);
      toast.error(isEnglish ? 'Invalid store hours' : 'Horarios inválidos');
      setAvailableTimes([]);
      return;
    }

    console.log('✓ Horarios parseados correctamente');

    // Duración del turno (por defecto 45 minutos si no está configurado)
    const duration = selectedStore.appointmentDuration || 45;

    // Generar todos los horarios posibles
    const times: string[] = [];
    let currentHour = openHour;
    let currentMinute = openMinute;

    // Si es hoy, filtrar horarios que ya pasaron
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(year, month - 1, day); // Usar las mismas variables parseadas arriba
    
    let minTimeInMinutes = 0; // Tiempo mínimo en minutos desde medianoche
    
    if (selectedDay.getTime() === today.getTime()) {
      // Es hoy, calcular el tiempo mínimo (hora actual)
      const currentHourNow = now.getHours();
      const currentMinuteNow = now.getMinutes();
      
      // Tiempo mínimo = hora actual (sin sumar nada)
      // Así si son las 15:09, sigue mostrando el turno de las 15:00 hasta que sean las 15:45
      minTimeInMinutes = currentHourNow * 60 + currentMinuteNow;
      
      console.log('Es hoy - Hora actual:', currentHourNow + ':' + currentMinuteNow);
      console.log('Tiempo mínimo en minutos:', minTimeInMinutes, '(' + Math.floor(minTimeInMinutes / 60) + ':' + (minTimeInMinutes % 60) + ')');
    }

    while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
      const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
      
      // Si es hoy, solo agregar si el slot todavía no terminó
      if (selectedDay.getTime() === today.getTime()) {
        const slotStartInMinutes = currentHour * 60 + currentMinute;
        const slotEndInMinutes = slotStartInMinutes + duration;
        
        // Mostrar el turno si todavía no terminó (si la hora actual < hora de fin del slot)
        if (minTimeInMinutes < slotEndInMinutes) {
          times.push(timeStr);
        }
      } else {
        // No es hoy, agregar todos los horarios
        times.push(timeStr);
      }

      // Avanzar según duración del turno
      currentMinute += duration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }
    
    console.log('Horarios generados:', times.length, 'slots');

    setAvailableTimes(times);

    // Obtener turnos ocupados para ese día
    try {
      const token = Cookies.get('accessToken');
      const res = await axios.get(`${API}/appointments?date=${formData.date}&storeId=${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const occupied = res.data.appointments
        .filter((apt: any) => apt.status !== 'CANCELLED')
        .map((apt: any) => apt.time);
      setOccupiedTimes(occupied);
    } catch (error) {
      console.error('Error loading occupied times:', error);
      setOccupiedTimes([]);
    }
  };

  const selectTime = (time: string) => {
    setFormData(prev => ({ ...prev, time, storeId: selectedStoreForTimes }));
    setShowAvailableTimesModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.time || !formData.customerName || !formData.customerPhone) {
      toast.error(isEnglish ? 'Please fill required fields' : 'Completá los campos requeridos');
      return;
    }

    // Validar horario de la sucursal
    const selectedStore = stores.find(s => s.id === formData.storeId);
    if (selectedStore && formData.date && formData.time) {
      const selectedDate = new Date(formData.date);
      const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      const dayNames = ['sundayHours', 'mondayHours', 'tuesdayHours', 'wednesdayHours', 'thursdayHours', 'fridayHours', 'saturdayHours'];
      const dayHours = selectedStore[dayNames[dayOfWeek] as keyof Store] as string | undefined;
      
      if (!dayHours || dayHours === 'Cerrado' || dayHours === 'Closed') {
        const confirmOutside = confirm(
          isEnglish 
            ? `The store is closed on this day. Do you want to create the appointment anyway?`
            : `La sucursal está cerrada este día. ¿Querés crear el turno igual?`
        );
        if (!confirmOutside) return;
      } else {
        // Validar si la hora está dentro del rango
        const [openTime, closeTime] = dayHours.split(' - ');
        if (openTime && closeTime) {
          const [selectedHour, selectedMinute] = formData.time.split(':').map(Number);
          const [openHour, openMinute] = openTime.split(':').map(Number);
          const [closeHour, closeMinute] = closeTime.split(':').map(Number);
          
          const selectedMinutes = selectedHour * 60 + selectedMinute;
          const openMinutes = openHour * 60 + openMinute;
          const closeMinutes = closeHour * 60 + closeMinute;
          
          if (selectedMinutes < openMinutes || selectedMinutes >= closeMinutes) {
            const confirmOutside = confirm(
              isEnglish 
                ? `The selected time (${formData.time}) is outside store hours (${dayHours}). Do you want to create the appointment anyway?`
                : `La hora seleccionada (${formData.time}) está fuera del horario de la sucursal (${dayHours}). ¿Querés crear el turno igual?`
            );
            if (!confirmOutside) return;
          }
        }
      }
    }

    setLoading(true);
    try {
      const token = Cookies.get('accessToken');
      
      const selectedProduct = products.find(p => p.id === formData.productId);
      let productDetail = '';
      
      if (selectedProduct) {
        if (selectedProduct.category === 'PHONE') {
          productDetail = `${selectedProduct.model || selectedProduct.name} ${selectedProduct.storage || ''} ${selectedProduct.color || ''} - IMEI: ${selectedProduct.imei || 'N/A'} - Batería: ${selectedProduct.battery || 'N/A'}%`;
        } else {
          productDetail = `${selectedProduct.name} ${selectedProduct.model || ''}`.trim();
        }
      }
      
      // Convertir fecha a formato ISO con hora local para evitar problemas de zona horaria
      const [year, month, day] = formData.date.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day, 12, 0, 0); // Usar mediodía para evitar cambios de día
      
      const payload: any = {
        date: dateObj.toISOString(),
        time: formData.time,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        paymentMethod: formData.paymentMethods.map(p => p.method).join(', '),
        customerType: formData.customerType,
        storeId: formData.storeId,
      };
      
      if (formData.productId) {
        payload.productId = formData.productId;
        payload.product = productDetail;
      }
      
      await axios.post(`${API}/appointments`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success(isEnglish ? 'Appointment created' : 'Turno creado');
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast.error(error.response?.data?.error || (isEnglish ? 'Error creating appointment' : 'Error al crear turno'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      date: '',
      time: '',
      productId: '',
      paymentMethods: [{ method: 'CASH_USD' }],
      customerType: 'MINORISTA',
      storeId: stores[0]?.id || '',
    });
    setCategory('PHONE');
    setSelectedStoreForTimes('');
    onClose();
  };

  const addPaymentMethod = () => {
    setFormData({
      ...formData,
      paymentMethods: [...formData.paymentMethods, { method: 'CASH_USD' }],
    });
  };

  const removePaymentMethod = (index: number) => {
    if (formData.paymentMethods.length > 1) {
      setFormData({
        ...formData,
        paymentMethods: formData.paymentMethods.filter((_, i) => i !== index),
      });
    }
  };

  const updatePaymentMethod = (index: number, method: string) => {
    const newMethods = [...formData.paymentMethods];
    newMethods[index] = { method };
    setFormData({ ...formData, paymentMethods: newMethods });
  };

  // Mostrar todos los productos, incluyendo reservados
  const filteredProducts = products;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{isEnglish ? 'New Appointment' : 'Nuevo turno'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre y Teléfono */}
          <div>
            <Label className="text-gray-600">{isEnglish ? 'Customer Name' : 'Nombre del cliente'}</Label>
            <Input
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder={isEnglish ? 'John Doe' : 'Lautaro Barberis'}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-gray-600">{isEnglish ? 'Phone' : 'Teléfono'}</Label>
            <Input
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              placeholder="1135981894"
              required
              className="mt-1"
            />
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-600">{isEnglish ? 'Date' : 'Fecha'}</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-600">{isEnglish ? 'Time' : 'Hora'}</Label>
              <div className="flex gap-2 mt-1">
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

          {/* Categoría y Producto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-600">{isEnglish ? 'Category' : 'Categoría'}</Label>
              <Select value={category} onValueChange={(v: 'PHONE' | 'ACCESSORY') => {
                setCategory(v);
                setFormData({ ...formData, productId: '' });
              }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHONE">
                    <span className="flex items-center gap-2">
                      iPhone
                    </span>
                  </SelectItem>
                  <SelectItem value="ACCESSORY">
                    {isEnglish ? 'Accessory' : 'Accesorio'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-600">{isEnglish ? 'Product' : 'Producto'}</Label>
              <Select value={formData.productId} onValueChange={handleProductChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={isEnglish ? 'Select product' : 'Seleccionar producto'} />
                </SelectTrigger>
                <SelectContent>
                  {filteredProducts.map((product) => {
                    const isReserved = product.reserved > 0 && product.stock === product.reserved;
                    let displayText = '';
                    
                    if (category === 'PHONE') {
                      displayText = `${product.model || product.name} ${product.storage || ''} ${product.color || ''} - ${product.battery || 'N/A'}%`;
                    } else {
                      displayText = `${product.name} ${product.model || ''}`;
                    }
                    
                    return (
                      <SelectItem 
                        key={product.id} 
                        value={product.id}
                        className={isReserved ? 'text-green-600 font-medium' : ''}
                      >
                        {displayText}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Forma de pago */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-gray-600">{isEnglish ? 'Payment Method' : 'Forma de pago'}</Label>
              <button 
                type="button" 
                onClick={addPaymentMethod}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                {isEnglish ? 'Add' : 'Agregar'}
              </button>
            </div>
            <div className="space-y-2">
              {formData.paymentMethods.map((payment, index) => (
                <div key={index} className="flex gap-2">
                  <Select 
                    value={payment.method} 
                    onValueChange={(v) => updatePaymentMethod(index, v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH_USD">Efectivo USD</SelectItem>
                      <SelectItem value="CASH_ARS">Efectivo ARS</SelectItem>
                      <SelectItem value="TRANSFER">Transferencia</SelectItem>
                      <SelectItem value="USDT_BINANCE">USDT</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.paymentMethods.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removePaymentMethod(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tipo de cliente y Sucursal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-600">{isEnglish ? 'Customer Type' : 'Tipo de cliente'}</Label>
              <Select value={formData.customerType} onValueChange={(v) => setFormData({ ...formData, customerType: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MINORISTA">
                    {isEnglish ? 'Retail' : 'Minorista'}
                  </SelectItem>
                  <SelectItem value="MAYORISTA">
                    {isEnglish ? 'Wholesale' : 'Mayorista'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-600">{isEnglish ? 'Store' : 'Sucursal'}</Label>
              <Select value={formData.storeId} onValueChange={(v) => setFormData({ ...formData, storeId: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
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
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              {isEnglish ? 'Cancel' : 'Cancelar'}
            </Button>
            <Button type="submit" disabled={loading} className="bg-black hover:bg-gray-800">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Plus className="h-4 w-4 mr-2" />
              {isEnglish ? 'Create Appointment' : 'Crear turno'}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Alert Dialog: Producto Reservado */}
      <AlertDialog open={showReservedAlert} onOpenChange={setShowReservedAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              {isEnglish ? 'Reserved Product' : 'Producto Reservado'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {isEnglish 
                ? 'This product is reserved. Do you want to create the appointment anyway?'
                : 'Este producto está reservado. ¿Confirmar igual?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelReserved}>
              {isEnglish ? 'Cancel' : 'Cancelar'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReserved} className="bg-yellow-600 hover:bg-yellow-700">
              {isEnglish ? 'Confirm Anyway' : 'Confirmar Igual'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          
          {/* Selector de sucursal */}
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

            {/* Horarios disponibles */}
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
    </Dialog>
  );
}
