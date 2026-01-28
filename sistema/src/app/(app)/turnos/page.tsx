'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Clock, Phone, User, Package, MapPin, Check, X,
  Plus, Search, CreditCard, RefreshCw, MessageCircle, Edit, Send, Trash2
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useImeiScanner } from '@/hooks/useImeiScanner';
import ImeiScanner from '@/components/common/ImeiScanner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, FileText, CalendarCheck } from 'lucide-react';
import { getFeaturesForLocale } from '@/lib/features';
import { useTranslation } from '@/i18n/I18nProvider';
import ConversationModal from '@/components/turnos/ConversationModal';

// Component to show when appointments feature is disabled
function AppointmentsDisabledMessage() {
  const { locale } = useTranslation();
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center max-w-md">
        <Calendar className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
        <h2 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
          {locale === 'es' ? 'Turnos no disponible' : 'Appointments not available'}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">
          {locale === 'es' 
            ? 'El módulo de turnos no está disponible en esta versión.'
            : 'The appointments module is not available in this version.'}
        </p>
      </div>
    </div>
  );
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  customerDni?: string;
  dniFrontUrl?: string;
  dniBackUrl?: string;
  hasCompanion?: boolean;
  companionName?: string;
  companionDni?: string;
  product?: string;
  productId?: string;
  paymentMethod?: string;
  customerType?: string;
  assignedUserId?: string;
  assignedUser?: { id: string; name: string; email: string };
  status: 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  source: 'WHATSAPP' | 'MANUAL' | 'WEB';
  notes?: string;
  store?: { id: string; name: string };
  createdAt: string;
}

const statusConfig: Record<string, { label: string; class: string }> = {
  CONFIRMED: { label: 'Confirmado', class: 'bg-green-500/20 text-green-400' },
  PENDING: { label: 'Pendiente', class: 'bg-yellow-500/20 text-yellow-400' },
  COMPLETED: { label: 'Atendido', class: 'bg-blue-500/20 text-blue-400' },
  CANCELLED: { label: 'Cancelado', class: 'bg-red-500/20 text-red-400' },
  NO_SHOW: { label: 'No vino', class: 'bg-zinc-500/20 text-zinc-400' },
};

const paymentLabels: Record<string, string> = {
  CASH_USD: 'Efectivo USD',
  CASH_ARS: 'Efectivo ARS',
  TRANSFER: 'Transferencia',
  USDT_BINANCE: 'USDT',
};

// Content component
function TurnosPageContent() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStore, setFilterStore] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [tenantName, setTenantName] = useState('');
  
  // Modal cancelar
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  
  // Modal atendido
  const [completedOpen, setCompletedOpen] = useState(false);
  const [completedUserId, setCompletedUserId] = useState('');
  const [completedLoading, setCompletedLoading] = useState(false);
  const [completedPaymentMethod, setCompletedPaymentMethod] = useState('CASH_USD');
  const [completedPrice, setCompletedPrice] = useState(0);
  const [completedProduct, setCompletedProduct] = useState<any>(null);
  
  // Modal modificar
  const [modifyOpen, setModifyOpen] = useState(false);
  const [modifyDate, setModifyDate] = useState('');
  const [modifyTime, setModifyTime] = useState('');
  const [modifyMessage, setModifyMessage] = useState('');
  
  // Selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [modifyLoading, setModifyLoading] = useState(false);
  
  // Cargar nombre del tenant
  useEffect(() => {
    const savedName = localStorage.getItem('tenantName');
    if (savedName) setTenantName(savedName);
  }, []);
  
  // Modal confirmación eliminar
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Historial
  const [historyAppointments, setHistoryAppointments] = useState<Appointment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptAppointment, setReceiptAppointment] = useState<Appointment | null>(null);
  
  // Modal conversación
  const [conversationOpen, setConversationOpen] = useState(false);
  const [conversationPhone, setConversationPhone] = useState('');
  const [conversationName, setConversationName] = useState('');
  
  // Modal nuevo turno
  const [newOpen, setNewOpen] = useState(false);
  const [newLoading, setNewLoading] = useState(false);
  const [newData, setNewData] = useState({
    customerName: '',
    customerPhone: '',
    date: '',
    time: '',
    product: '',
    paymentMethods: ['CASH_USD'] as string[],
    storeId: '',
    customerType: 'MINORISTA' as 'MAYORISTA' | 'MINORISTA',
    quantity: 1,
    assignedUserId: ''
  });
  // Lista de productos para mayorista (múltiples productos)
  const [mayoristaProducts, setMayoristaProducts] = useState<Array<{
    category: 'PHONE' | 'ACCESSORY';
    model: string;
    color: string;
    storage: string;
    battery: string;
    quantity: number;
  }>>([]);
  const [stores, setStores] = useState<Array<{
    id: string, 
    name: string,
    mondayHours?: string | null,
    tuesdayHours?: string | null,
    wednesdayHours?: string | null,
    thursdayHours?: string | null,
    fridayHours?: string | null,
    saturdayHours?: string | null,
    sundayHours?: string | null
  }>>([]);
  const [products, setProducts] = useState<Array<{id: string, name: string, model: string, storage: string, color?: string, battery?: number, category: string, reserved?: number, price?: number}>>([]);
  const [selectedCategory, setSelectedCategory] = useState<'PHONE' | 'ACCESSORY' | ''>('');
  const [users, setUsers] = useState<Array<{id: string, name: string, email: string}>>([]);
  
  // Estados para selector en cascada de productos
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedBattery, setSelectedBattery] = useState('');
  
  // Modal confirmación horario fuera de rango
  const [scheduleWarningOpen, setScheduleWarningOpen] = useState(false);
  const [scheduleWarningMsg, setScheduleWarningMsg] = useState('');
  
  // Modal conflicto de horario
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflictData, setConflictData] = useState<{
    message: string;
    alternatives: string[];
  } | null>(null);

  // Scanner IMEI - solo cuando el modal de nuevo turno está abierto
  const handleImeiScan = useCallback((imei: string, result: any) => {
    if (!newOpen) return; // Dejar que el scanner global maneje si el modal está cerrado
    
    // Auto-seleccionar producto en el modal
    if (result.found && result.data) {
      const productName = `${result.data.model || ''} ${result.data.storage || ''}`.trim();
      const matchingProduct = products.find(p => 
        `${p.name || p.model} ${p.storage || ''}`.trim().toLowerCase() === productName.toLowerCase()
      );
      
      if (matchingProduct) {
        setSelectedCategory(matchingProduct.category as 'PHONE' | 'ACCESSORY');
        setNewData(prev => ({...prev, product: productName}));
        toast.success(`Producto seleccionado: ${productName}`);
      } else {
        toast.error(`Producto no encontrado en stock: ${productName}`);
      }
    } else {
      toast.error('IMEI no reconocido');
    }
  }, [newOpen, products]);

  // Solo activar scanner personalizado cuando el modal está abierto
  useImeiScanner({ onScan: newOpen ? handleImeiScan : undefined, enabled: true });

  // Listener para evento global de scanner (búsqueda en turnos)
  useEffect(() => {
    const handleGlobalScan = (e: CustomEvent) => {
      const { product } = e.detail;
      if (product?.model && !newOpen) {
        setSearchTerm(product.model);
      }
    };
    
    window.addEventListener('imei-scanned-turno', handleGlobalScan as EventListener);
    return () => window.removeEventListener('imei-scanned-turno', handleGlobalScan as EventListener);
  }, [newOpen]);

  // Funciones para selector en cascada de productos
  const getAvailableModels = () => {
    const filtered = products.filter(p => 
      selectedCategory === 'PHONE' ? p.category === 'PHONE' : p.category === 'ACCESSORY'
    );
    
    console.log('Productos filtrados:', filtered.map(p => ({ model: p.model, name: p.name, storage: p.storage, color: p.color })));
    
    if (selectedCategory === 'PHONE') {
      // Extraer modelos únicos (iPhone 16, iPhone 15 Pro, etc)
      const models = new Set<string>();
      filtered.forEach(p => {
        let fullModel = p.model || p.name || '';
        // Solo quitar storage y batería, mantener todo lo demás
        fullModel = fullModel.replace(/\s*\d+(GB|TB)\s*/gi, ' ').trim();
        fullModel = fullModel.replace(/\s*\d+%\s*/g, ' ').trim();
        // Limpiar espacios múltiples
        fullModel = fullModel.replace(/\s+/g, ' ').trim();
        
        if (fullModel) {
          models.add(fullModel);
        }
      });
      
      const modelArray = Array.from(models);
      console.log('Modelos únicos encontrados:', modelArray);
      
      return modelArray.sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numB - numA; // Descendente
      });
    } else {
      // Para accesorios, devolver nombres únicos
      const names = new Set(filtered.map(p => p.name || p.model));
      return Array.from(names).sort();
    }
  };

  const getAvailableColors = () => {
    if (!selectedModel) return [];
    const filtered = products.filter(p => {
      const fullModel = (p.model || p.name || '').replace(/\s*\d+GB|\s*\d+TB/gi, '').trim();
      return fullModel === selectedModel && p.category === selectedCategory;
    });
    const colors = new Set(filtered.map(p => p.color).filter(Boolean));
    return Array.from(colors).sort();
  };

  const getAvailableStorages = () => {
    if (!selectedModel) return [];
    const filtered = products.filter(p => {
      const fullModel = (p.model || p.name || '').replace(/\s*\d+GB|\s*\d+TB/gi, '').trim();
      const matchesModel = fullModel === selectedModel;
      const matchesColor = !selectedColor || p.color === selectedColor;
      return matchesModel && matchesColor && p.category === selectedCategory;
    });
    const storages = new Set(filtered.map(p => p.storage).filter(Boolean));
    return Array.from(storages).sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB; // Ascendente
    });
  };

  const getAvailableBatteries = () => {
    if (!selectedModel) return [];
    const filtered = products.filter(p => {
      const fullModel = (p.model || p.name || '').replace(/\s*\d+GB|\s*\d+TB/gi, '').trim();
      const matchesModel = fullModel === selectedModel;
      const matchesColor = !selectedColor || p.color === selectedColor;
      const matchesStorage = !selectedStorage || p.storage === selectedStorage;
      return matchesModel && matchesColor && matchesStorage && p.category === selectedCategory && p.battery;
    });
    const batteries = new Set(filtered.map(p => p.battery).filter(Boolean));
    return Array.from(batteries).sort((a, b) => (b as number) - (a as number)); // Descendente
  };

  // Construir string del producto seleccionado
  const buildProductString = () => {
    if (!selectedModel) return '';
    let str = selectedModel;
    if (selectedColor) str += ` ${selectedColor}`;
    if (selectedStorage) str += ` ${selectedStorage}`;
    if (selectedBattery) str += ` ${selectedBattery}%`;
    return str.trim();
  };

  // Resetear selección en cascada cuando cambia la categoría
  useEffect(() => {
    setSelectedModel('');
    setSelectedColor('');
    setSelectedStorage('');
    setSelectedBattery('');
    setNewData(prev => ({...prev, product: ''}));
  }, [selectedCategory]);

  // Actualizar producto cuando cambia la selección
  useEffect(() => {
    const productStr = buildProductString();
    if (productStr) {
      setNewData(prev => ({...prev, product: productStr}));
    }
  }, [selectedModel, selectedColor, selectedStorage, selectedBattery]);

  useEffect(() => {
    fetchAppointments();
    fetchStores();
    fetchProducts();
    fetchUsers();
    fetchHistory();
  }, [filterStatus]);

  useEffect(() => {
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const fetchStores = async () => {
    try {
      const token = Cookies.get('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/stores`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStores(response.data.stores || response.data || []);
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = Cookies.get('token');
      const [phonesRes, accRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/products?category=PHONE`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/products?category=ACCESSORY`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const phones = (phonesRes.data.products || phonesRes.data || []).map((p: any) => ({ ...p, category: 'PHONE' }));
      const accs = (accRes.data.products || accRes.data || []).map((p: any) => ({ ...p, category: 'ACCESSORY' }));
      console.log('Total productos cargados:', { phones: phones.length, accessories: accs.length });
      setProducts([...phones, ...accs]);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = Cookies.get('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(response.data.users || response.data || []);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('token');
      const params: Record<string, string> = { limit: '200' };
      // NO filtrar por fecha - mostrar TODOS los turnos
      if (filterStatus !== 'all') params.status = filterStatus;

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments`,
        { headers: { Authorization: `Bearer ${token}` }, params }
      );
      
      // Filtrar solo turnos de hoy en adelante (no mostrar pasados)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const allAppointments = response.data.appointments || [];
      const futureAppointments = allAppointments.filter((apt: Appointment) => {
        const aptDate = new Date(apt.date);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate >= today;
      });
      
      setAppointments(futureAppointments);
    } catch (error) {
      console.error('Error cargando turnos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar historial (turnos completados)
  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const token = Cookies.get('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments`,
        { headers: { Authorization: `Bearer ${token}` }, params: { status: 'COMPLETED', limit: '500' } }
      );
      
      const completed = (response.data.appointments || []).sort((a: Appointment, b: Appointment) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setHistoryAppointments(completed);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string, extra?: any) => {
    try {
      const token = Cookies.get('token');
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments/${id}/status`,
        { status: newStatus, ...extra },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAppointments();
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  // Abrir modal cancelar
  const openCancelModal = (apt: Appointment) => {
    setSelectedAppointment(apt);
    const nombre = tenantName || 'nuestro local';
    setCancelMessage(`Hola! Te escribimos de ${nombre}. Lamentablemente tuvimos que cancelar tu turno. Disculpá las molestias, cualquier cosa escribinos para reagendar.`);
    setCancelOpen(true);
  };

  // Abrir modal atendido
  const openCompletedModal = async (apt: Appointment) => {
    setSelectedAppointment(apt);
    setCompletedUserId('');
    setCompletedPaymentMethod(apt.paymentMethod || 'CASH_USD');
    setCompletedProduct(null);
    setCompletedPrice(0);
    
    // Si tiene producto asociado, cargar sus datos solo para mostrar info
    if (apt.productId) {
      try {
        const token = Cookies.get('token');
        const res = await axios.get(`${API}/products/${apt.productId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCompletedProduct(res.data);
      } catch (error) {
        console.error('Error loading product:', error);
        setCompletedProduct(null);
      }
    } else if (apt.product) {
      // Buscar el producto en la lista local solo para mostrar info
      const productName = apt.product.split(' x')[0].trim();
      const foundProduct = products.find(p => {
        const fullName = `${p.name || p.model} ${p.storage || ''}`.trim();
        return fullName.toLowerCase() === productName.toLowerCase();
      });
      if (foundProduct) {
        setCompletedProduct(foundProduct);
      }
    }
    
    setCompletedOpen(true);
  };

  // Confirmar atendido
  const confirmCompleted = async () => {
    if (!selectedAppointment || !completedUserId || completedLoading) return;
    setCompletedLoading(true);
    try {
      await updateStatus(selectedAppointment.id, 'COMPLETED', { 
        assignedUserId: completedUserId,
        paymentMethod: completedPaymentMethod,
        salePrice: completedPrice
      });
      
      // Refrescar lista de turnos
      await fetchAppointments();
      
      setCompletedOpen(false);
      setDetailOpen(false);
      
      toast.success('Turno marcado como atendido y venta registrada');
    } catch (error) {
      toast.error('Error al confirmar turno');
    } finally {
      setCompletedLoading(false);
    }
  };

  // Confirmar cancelación
  const confirmCancel = async () => {
    if (!selectedAppointment) return;
    setCancelLoading(true);
    await updateStatus(selectedAppointment.id, 'CANCELLED', { message: cancelMessage });
    
    // Refrescar lista de turnos
    await fetchAppointments();
    
    setCancelLoading(false);
    setCancelOpen(false);
    setDetailOpen(false);
  };

  // Abrir modal modificar
  const openModifyModal = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setModifyDate(format(new Date(apt.date), 'yyyy-MM-dd'));
    setModifyTime(apt.time);
    setModifyMessage('');
    setModifyOpen(true);
  };

  // Confirmar modificación
  const confirmModify = async () => {
    if (!selectedAppointment) return;
    setModifyLoading(true);
    
    const fechaStr = format(new Date(modifyDate), "EEEE d 'de' MMMM", { locale: es });
    const nombre = tenantName || 'nuestro local';
    const defaultMsg = `Hola! Te escribimos de ${nombre}. Te queríamos avisar que tu turno fue modificado para el ${fechaStr} a las ${modifyTime}hs. Disculpá las molestias, te esperamos!`;
    
    await updateStatus(selectedAppointment.id, selectedAppointment.status, { 
      newDate: modifyDate, 
      newTime: modifyTime,
      message: modifyMessage || defaultMsg
    });
    
    // Refrescar lista de turnos
    await fetchAppointments();
    
    setModifyLoading(false);
    setModifyOpen(false);
    setDetailOpen(false);
  };

  // Toggle selección
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Seleccionar todos
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAppointments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAppointments.map(a => a.id)));
    }
  };

  // Abrir modal confirmación eliminar
  const openDeleteConfirm = () => {
    if (selectedIds.size === 0) return;
    setDeleteConfirmOpen(true);
  };

  // Eliminar seleccionados (después de confirmar)
  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeleteLoading(true);
    const token = Cookies.get('token');
    const idsArray = Array.from(selectedIds);
    
    let successCount = 0;
    let errorCount = 0;
    let lastError = null;
    
    for (let i = 0; i < idsArray.length; i++) {
      try {
        const response = await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/appointments/${idsArray[i]}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Turno eliminado:', response.data);
        successCount++;
      } catch (error: any) {
        console.error('Error eliminando turno:', error);
        console.error('Error response:', error.response?.data);
        lastError = error.response?.data?.error || error.message;
        errorCount++;
      }
    }
    
    setSelectedIds(new Set());
    setDeleteLoading(false);
    setDeleteConfirmOpen(false);
    
    // Mostrar resultado
    if (errorCount === 0) {
      toast.success(`${successCount} ${successCount === 1 ? 'turno eliminado' : 'turnos eliminados'} correctamente`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} eliminados, ${errorCount} con error: ${lastError}`);
    } else {
      toast.error(`Error al eliminar los turnos: ${lastError || 'Error desconocido'}`);
    }
    
    // Recargar lista
    await fetchAppointments();
  };

  // Abrir modal nuevo turno
  const openNewModal = () => {
    setNewData({
      customerName: '',
      customerPhone: '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: '10:00',
      product: '',
      paymentMethods: ['CASH_USD'],
      storeId: stores[0]?.id || '',
      customerType: 'MINORISTA',
      quantity: 1,
      assignedUserId: ''
    });
    setSelectedCategory('');
    setSelectedModel('');
    setSelectedColor('');
    setSelectedStorage('');
    setSelectedBattery('');
    setMayoristaProducts([]);
    setNewOpen(true);
  };

  // Funciones para manejar productos mayorista
  const addMayoristaProduct = () => {
    setMayoristaProducts([...mayoristaProducts, { category: 'PHONE', model: '', color: '', storage: '', battery: '', quantity: 1 }]);
  };

  const updateMayoristaProduct = (index: number, field: string, value: any) => {
    const updated = [...mayoristaProducts];
    updated[index] = { ...updated[index], [field]: value };
    // Si cambia la categoría o modelo, resetear los campos dependientes
    if (field === 'category') {
      updated[index].model = '';
      updated[index].color = '';
      updated[index].storage = '';
      updated[index].battery = '';
    } else if (field === 'model') {
      updated[index].color = '';
      updated[index].storage = '';
      updated[index].battery = '';
    } else if (field === 'color') {
      updated[index].storage = '';
      updated[index].battery = '';
    } else if (field === 'storage') {
      updated[index].battery = '';
    }
    setMayoristaProducts(updated);
  };

  const removeMayoristaProduct = (index: number) => {
    setMayoristaProducts(mayoristaProducts.filter((_, i) => i !== index));
  };
  
  // Construir string de producto mayorista
  const buildMayoristaProductString = (mp: typeof mayoristaProducts[0]) => {
    if (!mp.model) return '';
    let str = mp.model;
    if (mp.color) str += ` ${mp.color}`;
    if (mp.storage) str += ` ${mp.storage}`;
    if (mp.battery) str += ` ${mp.battery}%`;
    return str.trim();
  };

  // Obtener opciones para productos mayorista (funciones auxiliares)
  const getMayoristaModels = (category: 'PHONE' | 'ACCESSORY') => {
    const filtered = products.filter(p => p.category === category);
    const models = new Set<string>();
    filtered.forEach(p => {
      const fullModel = (p.model || p.name || '').replace(/\s*\d+GB|\s*\d+TB/gi, '').trim();
      models.add(fullModel);
    });
    return Array.from(models).sort((a, b) => {
      if (category === 'PHONE') {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numB - numA;
      }
      return a.localeCompare(b);
    });
  };

  const getMayoristaColors = (category: 'PHONE' | 'ACCESSORY', model: string) => {
    if (!model) return [];
    const filtered = products.filter(p => {
      const fullModel = (p.model || p.name || '').replace(/\s*\d+GB|\s*\d+TB/gi, '').trim();
      return fullModel === model && p.category === category;
    });
    const colors = new Set(filtered.map(p => p.color).filter(Boolean));
    return Array.from(colors).sort();
  };

  const getMayoristaStorages = (category: 'PHONE' | 'ACCESSORY', model: string, color: string) => {
    if (!model) return [];
    const filtered = products.filter(p => {
      const fullModel = (p.model || p.name || '').replace(/\s*\d+GB|\s*\d+TB/gi, '').trim();
      const matchesModel = fullModel === model;
      const matchesColor = !color || p.color === color;
      return matchesModel && matchesColor && p.category === category;
    });
    const storages = new Set(filtered.map(p => p.storage).filter(Boolean));
    return Array.from(storages).sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });
  };

  const getMayoristaBatteries = (category: 'PHONE' | 'ACCESSORY', model: string, color: string, storage: string) => {
    if (!model) return [];
    const filtered = products.filter(p => {
      const fullModel = (p.model || p.name || '').replace(/\s*\d+GB|\s*\d+TB/gi, '').trim();
      const matchesModel = fullModel === model;
      const matchesColor = !color || p.color === color;
      const matchesStorage = !storage || p.storage === storage;
      return matchesModel && matchesColor && matchesStorage && p.category === category && p.battery;
    });
    const batteries = new Set(filtered.map(p => p.battery).filter(Boolean));
    return Array.from(batteries).sort((a, b) => (b as number) - (a as number));
  };

  // Agregar método de pago
  const addPaymentMethod = () => {
    if (newData.paymentMethods.length < 4) {
      setNewData({...newData, paymentMethods: [...newData.paymentMethods, 'CASH_USD']});
    }
  };

  // Quitar método de pago
  const removePaymentMethod = (index: number) => {
    if (newData.paymentMethods.length > 1) {
      const updated = newData.paymentMethods.filter((_, i) => i !== index);
      setNewData({...newData, paymentMethods: updated});
    }
  };

  // Actualizar método de pago específico
  const updatePaymentMethod = (index: number, value: string) => {
    const updated = [...newData.paymentMethods];
    updated[index] = value;
    setNewData({...newData, paymentMethods: updated});
  };

  // Validar horario de la tienda
  const validateSchedule = (): { valid: boolean; message: string } => {
    if (!newData.storeId || !newData.date || !newData.time) return { valid: true, message: '' };
    
    // Validar que no sea un horario pasado
    const now = new Date();
    const appointmentDateTime = new Date(`${newData.date}T${newData.time}:00`);
    
    if (appointmentDateTime < now) {
      return {
        valid: false,
        message: `No podés crear un turno en un horario que ya pasó. Seleccioná una fecha y hora futura.`
      };
    }
    
    const store = stores.find(s => s.id === newData.storeId);
    if (!store) return { valid: true, message: '' };
    
    const date = new Date(newData.date + 'T12:00:00');
    const dayOfWeek = date.getDay();
    
    const dayHoursMap: Record<number, string | null | undefined> = {
      0: store.sundayHours,
      1: store.mondayHours,
      2: store.tuesdayHours,
      3: store.wednesdayHours,
      4: store.thursdayHours,
      5: store.fridayHours,
      6: store.saturdayHours
    };
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayHours = dayHoursMap[dayOfWeek];
    
    // Si no hay horario para ese día, está cerrado
    if (!dayHours) {
      return { 
        valid: false, 
        message: `${store.name} está cerrado los ${dayNames[dayOfWeek]}s. Querés crear el turno igual?` 
      };
    }
    
    // Validar que la hora esté dentro del rango
    const [openTime, closeTime] = dayHours.split('-');
    if (newData.time < openTime || newData.time >= closeTime) {
      return { 
        valid: false, 
        message: `El horario de ${store.name} los ${dayNames[dayOfWeek]}s es de ${openTime} a ${closeTime}. Querés crear el turno a las ${newData.time} igual?` 
      };
    }
    
    return { valid: true, message: '' };
  };

  // Crear turno (forzado o no)
  const doCreateAppointment = async (forceCreate: boolean = false) => {
    setNewLoading(true);
    try {
      const token = Cookies.get('token');
      
      // Construir el string de productos
      let productString = '';
      if (newData.customerType === 'MAYORISTA' && mayoristaProducts.length > 0) {
        // Mayorista con múltiples productos
        productString = mayoristaProducts
          .filter(p => p.model)
          .map(p => {
            const productStr = buildMayoristaProductString(p);
            return p.category === 'ACCESSORY' && p.quantity > 1 
              ? `${productStr} x${p.quantity}` 
              : productStr;
          })
          .join(' + ');
      } else {
        // Minorista o mayorista sin productos adicionales
        productString = newData.product + (newData.customerType === 'MAYORISTA' && newData.quantity > 1 ? ` x${newData.quantity}` : '');
      }
      
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/appointments`,
        {
          customerName: newData.customerName,
          customerPhone: newData.customerPhone,
          date: newData.date,
          time: newData.time,
          product: productString,
          paymentMethod: newData.paymentMethods.join(' + '),
          storeId: newData.storeId,
          source: 'MANUAL',
          customerType: newData.customerType,
          assignedUserId: newData.assignedUserId || undefined,
          forceCreate
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewOpen(false);
      setScheduleWarningOpen(false);
      setConflictOpen(false);
      toast.success('Turno creado correctamente');
      fetchAppointments();
    } catch (error: any) {
      // Manejar conflicto de horario (409)
      if (error.response?.status === 409) {
        const { alternativeSlots } = error.response.data;
        setConflictData({
          message: `Ya hay un turno a las ${newData.time}. ¿Querés elegir otro horario o crear igual?`,
          alternatives: alternativeSlots || []
        });
        setConflictOpen(true);
      } else {
        console.error('Error creando turno:', error);
        toast.error('Error al crear el turno');
      }
    } finally {
      setNewLoading(false);
    }
  };

  // Crear turno con validación
  const createAppointment = async () => {
    if (!newData.customerName || !newData.customerPhone || !newData.date || !newData.time) return;
    
    const { valid, message } = validateSchedule();
    if (!valid) {
      setScheduleWarningMsg(message);
      setScheduleWarningOpen(true);
      return;
    }
    
    await doCreateAppointment(false);
  };
  
  // Seleccionar horario alternativo
  const selectAlternativeTime = (time: string) => {
    setNewData(prev => ({ ...prev, time }));
    setConflictOpen(false);
    toast.info(`Horario cambiado a ${time}`);
  };

  const filteredAppointments = appointments
    .filter((apt) => {
      // Filtro por búsqueda
      const matchesSearch = 
        apt.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.customerPhone.includes(searchTerm) ||
        apt.product?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filtro por sucursal
      const matchesStore = filterStore === 'all' || apt.store?.id === filterStore;
      
      // Filtro por tipo de cliente
      const matchesType = filterType === 'all' || apt.customerType === filterType;
      
      return matchesSearch && matchesStore && matchesType;
    })
    // Ordenar por fecha ASC y luego por hora ASC (primeros turnos primero)
    .sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === 'CONFIRMED').length,
    pending: appointments.filter((a) => a.status === 'PENDING').length,
    completed: appointments.filter((a) => a.status === 'COMPLETED').length,
  };

  const openDetail = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setDetailOpen(true);
  };

  // Filtrar historial
  const filteredHistory = historyAppointments.filter(apt => 
    apt.customerName.toLowerCase().includes(historySearch.toLowerCase()) ||
    apt.customerPhone.includes(historySearch) ||
    apt.product?.toLowerCase().includes(historySearch.toLowerCase()) ||
    apt.assignedUser?.name?.toLowerCase().includes(historySearch.toLowerCase())
  );

  // Abrir comprobante
  const openReceipt = (apt: Appointment) => {
    setReceiptAppointment(apt);
    setReceiptOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Turnos</h1>
          <p className="text-sm text-zinc-500">Gestión de turnos agendados</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={openDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Eliminar ({selectedIds.size})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => { fetchAppointments(); fetchHistory(); }}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
          <Button size="sm" onClick={openNewModal}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="turnos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="turnos" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Turnos Activos
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial ({historyAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="turnos" className="space-y-4">

      {/* Filtros */}
      <div className="flex flex-col gap-3 p-4 rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input placeholder="Buscar por nombre, teléfono o producto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 dark:bg-zinc-800 dark:border-zinc-700" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px] dark:bg-zinc-800 dark:border-zinc-700">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PENDING">Pendientes</SelectItem>
              <SelectItem value="CONFIRMED">Confirmados</SelectItem>
              <SelectItem value="COMPLETED">Atendidos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={filterStore} onValueChange={setFilterStore}>
            <SelectTrigger className="w-[200px] dark:bg-zinc-800 dark:border-zinc-700">
              <MapPin className="h-4 w-4 mr-2 text-zinc-400" />
              <SelectValue placeholder="Sucursal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las sucursales</SelectItem>
              {stores.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] dark:bg-zinc-800 dark:border-zinc-700">
              <User className="h-4 w-4 mr-2 text-zinc-400" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="MINORISTA">🛒 Minorista</SelectItem>
              <SelectItem value="MAYORISTA">📦 Mayorista</SelectItem>
            </SelectContent>
          </Select>
          {(filterStore !== 'all' || filterType !== 'all' || filterStatus !== 'all' || searchTerm) && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-zinc-500 hover:text-zinc-700"
              onClick={() => {
                setFilterStore('all');
                setFilterType('all');
                setFilterStatus('all');
                setSearchTerm('');
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-xs text-zinc-500">Total</div>
          <div className="text-2xl font-semibold">{stats.total}</div>
        </div>
        <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
          <div className="text-xs text-yellow-500">Pendientes</div>
          <div className="text-2xl font-semibold text-yellow-500">{stats.pending}</div>
        </div>
        <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/10">
          <div className="text-xs text-green-500">Confirmados</div>
          <div className="text-2xl font-semibold text-green-500">{stats.confirmed}</div>
        </div>
        <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/10">
          <div className="text-xs text-blue-500">Atendidos</div>
          <div className="text-2xl font-semibold text-blue-500">{stats.completed}</div>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-800">
          <Calendar className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-3" />
          <p className="text-zinc-500">No hay turnos agendados</p>
        </div>
      ) : (
        <>
          {/* Vista Mobile - Tarjetas */}
          <div className="md:hidden space-y-2">
            {filteredAppointments.map((apt) => (
              <div 
                key={apt.id} 
                className="bg-white dark:bg-zinc-900 rounded-lg border dark:border-zinc-800 p-3 cursor-pointer active:bg-zinc-50 dark:active:bg-zinc-800"
                onClick={() => openDetail(apt)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedIds.has(apt.id)}
                      onCheckedChange={() => toggleSelect(apt.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <span className="font-medium">{apt.customerName}</span>
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <Phone className="h-3 w-3" />{apt.customerPhone}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig[apt.status]?.class}`}>
                    {statusConfig[apt.status]?.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-mono font-medium">{apt.time}</span>
                  <span className="text-zinc-500">
                    {(() => {
                      const aptDate = new Date(apt.date);
                      const today = new Date();
                      const aptDay = aptDate.getDate();
                      const aptMonth = aptDate.getMonth();
                      const aptYear = aptDate.getFullYear();
                      const todayDay = today.getDate();
                      const todayMonth = today.getMonth();
                      const todayYear = today.getFullYear();
                      const isToday = aptDay === todayDay && aptMonth === todayMonth && aptYear === todayYear;
                      const tomorrow = new Date(today);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      const isTomorrow = aptDay === tomorrow.getDate() && aptMonth === tomorrow.getMonth() && aptYear === tomorrow.getFullYear();
                      if (isToday) return <span className="text-green-500">Hoy</span>;
                      if (isTomorrow) return <span className="text-blue-400">Mañana</span>;
                      return format(aptDate, 'EEE d/M', { locale: es });
                    })()}
                  </span>
                  {apt.store?.name && <span className="text-zinc-400">{apt.store.name}</span>}
                  {apt.source === 'WHATSAPP' && <MessageCircle className="h-3 w-3 text-green-500" />}
                </div>
                {apt.product && <p className="text-xs text-zinc-500 mt-1">{apt.product}</p>}
                <div className="flex items-center gap-2 mt-2">
                  {apt.customerType === 'MAYORISTA' && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">📦 Mayorista</span>
                  )}
                  {apt.paymentMethod && (
                    <span className="text-xs text-zinc-400">{paymentLabels[apt.paymentMethod] || apt.paymentMethod}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Vista Desktop - Tabla */}
          <div className="hidden md:block rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-zinc-800">
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={selectedIds.size === filteredAppointments.length && filteredAppointments.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[100px]">Fecha</TableHead>
                  <TableHead className="w-[70px]">Hora</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((apt) => (
                  <TableRow key={apt.id} className="dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50" onClick={() => openDetail(apt)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedIds.has(apt.id)}
                        onCheckedChange={() => toggleSelect(apt.id)}
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      {(() => {
                        const aptDate = new Date(apt.date);
                        const today = new Date();
                        const aptDay = aptDate.getDate();
                        const aptMonth = aptDate.getMonth();
                        const aptYear = aptDate.getFullYear();
                        const todayDay = today.getDate();
                        const todayMonth = today.getMonth();
                        const todayYear = today.getFullYear();
                        const isToday = aptDay === todayDay && aptMonth === todayMonth && aptYear === todayYear;
                        const tomorrow = new Date(today);
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        const isTomorrow = aptDay === tomorrow.getDate() && aptMonth === tomorrow.getMonth() && aptYear === tomorrow.getFullYear();
                        if (isToday) return <span className="font-medium text-green-500">Hoy</span>;
                        if (isTomorrow) return <span className="font-medium text-blue-400">Mañana</span>;
                        return format(aptDate, 'EEE d/M', { locale: es });
                      })()}
                    </TableCell>
                    <TableCell className="font-mono font-medium">{apt.time}</TableCell>
                    <TableCell className="font-medium">{apt.customerName}</TableCell>
                    <TableCell className="text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />{apt.customerPhone}
                      </span>
                    </TableCell>
                    <TableCell>{apt.product || <span className="text-zinc-400">-</span>}</TableCell>
                    <TableCell>{apt.paymentMethod ? paymentLabels[apt.paymentMethod] || apt.paymentMethod : <span className="text-zinc-400">-</span>}</TableCell>
                    <TableCell>
                      {apt.customerType === 'MAYORISTA' ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-400">📦 Mayorista</span>
                      ) : apt.customerType === 'MINORISTA' ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">🛒 Minorista</span>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{apt.store?.name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConfig[apt.status]?.class}`}>
                          {statusConfig[apt.status]?.label}
                        </span>
                        {apt.source === 'WHATSAPP' && <MessageCircle className="h-3 w-3 text-green-500" />}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCompletedModal(apt);
                          }}
                        >
                          <Check className="h-5 w-5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
        </TabsContent>

        {/* Tab Historial */}
        <TabsContent value="historial" className="space-y-4">
          {/* Búsqueda en historial */}
          <div className="flex gap-3 p-4 rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-800">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input 
                placeholder="Buscar por nombre, teléfono, producto o vendedor..." 
                value={historySearch} 
                onChange={(e) => setHistorySearch(e.target.value)} 
                className="pl-9 dark:bg-zinc-800 dark:border-zinc-700" 
              />
            </div>
          </div>

          {/* Tabla de historial */}
          {historyLoading ? (
            <div className="flex items-center justify-center p-12">
              <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-800">
              <History className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-3" />
              <p className="text-zinc-500">No hay turnos en el historial</p>
            </div>
          ) : (
            <>
              {/* Vista Mobile - Tarjetas */}
              <div className="md:hidden space-y-2">
                {filteredHistory.map((apt) => (
                  <div 
                    key={apt.id} 
                    className="bg-white dark:bg-zinc-900 rounded-lg border dark:border-zinc-800 p-3 cursor-pointer active:bg-zinc-50 dark:active:bg-zinc-800"
                    onClick={() => openReceipt(apt)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-medium">{apt.customerName}</span>
                        <p className="text-xs text-zinc-500">{apt.customerPhone}</p>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {format(new Date(apt.date), 'dd/MM/yy', { locale: es })} {apt.time}
                      </span>
                    </div>
                    {apt.product && <p className="text-xs text-zinc-500 mb-1">{apt.product}</p>}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-green-500 font-medium">{apt.assignedUser?.name || '-'}</span>
                      {apt.paymentMethod && (
                        <span className="text-zinc-400">{paymentLabels[apt.paymentMethod] || apt.paymentMethod}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista Desktop - Tabla */}
              <div className="hidden md:block rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="dark:border-zinc-800">
                      <TableHead className="w-[100px]">Fecha</TableHead>
                      <TableHead className="w-[70px]">Hora</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead>Atendido por</TableHead>
                      <TableHead>Sucursal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((apt) => (
                      <TableRow 
                        key={apt.id} 
                        className="dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50" 
                        onClick={() => openReceipt(apt)}
                      >
                        <TableCell className="text-sm">
                          {format(new Date(apt.date), 'dd/MM/yy', { locale: es })}
                        </TableCell>
                        <TableCell className="font-mono font-medium">{apt.time}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{apt.customerName}</div>
                            <div className="text-xs text-zinc-500">{apt.customerPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{apt.product || '-'}</TableCell>
                        <TableCell>{apt.paymentMethod ? paymentLabels[apt.paymentMethod] || apt.paymentMethod : '-'}</TableCell>
                        <TableCell>
                          <span className="text-green-500 font-medium">
                            {apt.assignedUser?.name || '-'}
                          </span>
                        </TableCell>
                        <TableCell>{apt.store?.name || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Comprobante */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Comprobante de Turno
            </DialogTitle>
          </DialogHeader>
          {receiptAppointment && (
            <div className="space-y-4">
              {/* Estado */}
              <div className="flex justify-center">
                <div className="px-4 py-2 rounded-full bg-green-500/20 text-green-500 font-medium flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Turno Completado
                </div>
              </div>

              {/* Detalles */}
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center pb-3 border-b dark:border-zinc-700">
                  <span className="text-sm text-zinc-500">Fecha</span>
                  <span className="font-medium">
                    {format(new Date(receiptAppointment.date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b dark:border-zinc-700">
                  <span className="text-sm text-zinc-500">Hora</span>
                  <span className="font-mono font-medium text-lg">{receiptAppointment.time}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b dark:border-zinc-700">
                  <span className="text-sm text-zinc-500">Cliente</span>
                  <div className="text-right">
                    <div className="font-medium">{receiptAppointment.customerName}</div>
                    <div className="text-xs text-zinc-500">{receiptAppointment.customerPhone}</div>
                  </div>
                </div>
                {receiptAppointment.product && (
                  <div className="flex justify-between items-center pb-3 border-b dark:border-zinc-700">
                    <span className="text-sm text-zinc-500">Producto</span>
                    <span className="font-medium">{receiptAppointment.product}</span>
                  </div>
                )}
                {receiptAppointment.paymentMethod && (
                  <div className="flex justify-between items-center pb-3 border-b dark:border-zinc-700">
                    <span className="text-sm text-zinc-500">Forma de Pago</span>
                    <span className="font-medium">{paymentLabels[receiptAppointment.paymentMethod] || receiptAppointment.paymentMethod}</span>
                  </div>
                )}
                {receiptAppointment.customerType && (
                  <div className="flex justify-between items-center pb-3 border-b dark:border-zinc-700">
                    <span className="text-sm text-zinc-500">Tipo</span>
                    <span className={`font-medium ${receiptAppointment.customerType === 'MAYORISTA' ? 'text-purple-500' : 'text-blue-500'}`}>
                      {receiptAppointment.customerType === 'MAYORISTA' ? '📦 Mayorista' : '🛒 Minorista'}
                    </span>
                  </div>
                )}
                {receiptAppointment.store && (
                  <div className="flex justify-between items-center pb-3 border-b dark:border-zinc-700">
                    <span className="text-sm text-zinc-500">Sucursal</span>
                    <span className="font-medium">{receiptAppointment.store.name}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-zinc-500">Atendido por</span>
                  <span className="font-medium text-green-500">
                    {receiptAppointment.assignedUser?.name || 'No especificado'}
                  </span>
                </div>
              </div>

              {/* Origen */}
              <div className="flex justify-between items-center text-sm text-zinc-500">
                <span>Origen del turno</span>
                <span className="flex items-center gap-1">
                  {receiptAppointment.source === 'WHATSAPP' && <MessageCircle className="h-3 w-3 text-green-500" />}
                  {receiptAppointment.source === 'WHATSAPP' ? 'WhatsApp' : receiptAppointment.source === 'MANUAL' ? 'Manual' : 'Web'}
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                if (receiptAppointment) {
                  setConversationPhone(receiptAppointment.customerPhone);
                  setConversationName(receiptAppointment.customerName);
                  setReceiptOpen(false);
                  setConversationOpen(true);
                }
              }}
              className="flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Ver conversación
            </Button>
            <Button variant="outline" onClick={() => setReceiptOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle del turno</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-zinc-400" />
                  <span className="font-mono text-lg">{selectedAppointment.time}</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusConfig[selectedAppointment.status]?.class}`}>
                  {statusConfig[selectedAppointment.status]?.label}
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-zinc-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{selectedAppointment.customerName}</div>
                    <div className="text-zinc-500">{selectedAppointment.customerPhone}</div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setConversationPhone(selectedAppointment.customerPhone);
                      setConversationName(selectedAppointment.customerName);
                      setConversationOpen(true);
                    }}
                    className="text-xs"
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    Ver chat
                  </Button>
                </div>
                {selectedAppointment.product && (
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-zinc-400" />
                    <span>{selectedAppointment.product}</span>
                  </div>
                )}
                {selectedAppointment.paymentMethod && (
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4 text-zinc-400" />
                    <span>{paymentLabels[selectedAppointment.paymentMethod]}</span>
                  </div>
                )}
                {selectedAppointment.store && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-zinc-400" />
                    <span>{selectedAppointment.store.name}</span>
                  </div>
                )}
                {selectedAppointment.customerType && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-zinc-400" />
                    <span className={selectedAppointment.customerType === 'MAYORISTA' ? 'text-purple-400' : 'text-blue-400'}>
                      {selectedAppointment.customerType === 'MAYORISTA' ? '📦 Mayorista' : '🛒 Minorista'}
                    </span>
                  </div>
                )}
                {selectedAppointment.status === 'COMPLETED' && selectedAppointment.assignedUser && (
                  <div className="flex items-center gap-3 pt-2 border-t border-zinc-700">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-green-400">Atendido por: <span className="font-medium">{selectedAppointment.assignedUser.name}</span></span>
                  </div>
                )}
              </div>
              {selectedAppointment.status !== 'COMPLETED' && selectedAppointment.status !== 'CANCELLED' && (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => { setDetailOpen(false); openModifyModal(selectedAppointment); }}>
                    <Edit className="h-4 w-4 mr-1" />
                    Modificar
                  </Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { setDetailOpen(false); openCompletedModal(selectedAppointment); }}>
                    <Check className="h-4 w-4 mr-1" />
                    Atendido
                  </Button>
                  <Button variant="destructive" onClick={() => { setDetailOpen(false); openCancelModal(selectedAppointment); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Cancelar */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle>Cancelar turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">
              Se enviará un mensaje por WhatsApp al cliente ({selectedAppointment?.customerPhone}) informando la cancelación.
            </p>
            <div>
              <Label>Mensaje para el cliente</Label>
              <Textarea 
                value={cancelMessage} 
                onChange={(e) => setCancelMessage(e.target.value)}
                rows={4}
                className="mt-1 dark:bg-zinc-800"
                placeholder="Escribí el mensaje que se enviará al cliente..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Volver</Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={cancelLoading}>
              {cancelLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Cancelar y enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Atendido */}
      <Dialog open={completedOpen} onOpenChange={setCompletedOpen}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar como atendido</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Detalles del producto */}
            {completedProduct && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{completedProduct.name || completedProduct.model}</p>
                    {completedProduct.storage && (
                      <p className="text-xs text-muted-foreground">{completedProduct.storage} - {completedProduct.color}</p>
                    )}
                    {completedProduct.imei && (
                      <p className="text-xs text-muted-foreground font-mono">IMEI: {completedProduct.imei}</p>
                    )}
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
              <p className="text-xs text-muted-foreground mt-1">
                Precio original: ${completedProduct?.price?.toLocaleString('es-AR') || '0'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompletedOpen(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={confirmCompleted} disabled={completedLoading || !completedUserId || completedPrice <= 0}>
              {completedLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Confirmar venta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Modificar */}
      <Dialog open={modifyOpen} onOpenChange={setModifyOpen}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle>Modificar turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-zinc-500">
              Se enviará un mensaje por WhatsApp al cliente informando el cambio.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nueva fecha</Label>
                <Input type="date" value={modifyDate} onChange={(e) => setModifyDate(e.target.value)} className="mt-1 dark:bg-zinc-800" />
              </div>
              <div>
                <Label>Nueva hora</Label>
                <Input type="time" value={modifyTime} onChange={(e) => setModifyTime(e.target.value)} className="mt-1 dark:bg-zinc-800" />
              </div>
            </div>
            <div>
              <Label>Mensaje personalizado (opcional)</Label>
              <Textarea 
                value={modifyMessage} 
                onChange={(e) => setModifyMessage(e.target.value)}
                rows={3}
                className="mt-1 dark:bg-zinc-800"
                placeholder="Dejá vacío para usar el mensaje automático..."
              />
              <p className="text-xs text-zinc-500 mt-1">
                Si lo dejás vacío se enviará: "Te queríamos avisar que tu turno fue modificado para el [fecha] a las [hora]hs..."
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModifyOpen(false)}>Volver</Button>
            <Button onClick={confirmModify} disabled={modifyLoading}>
              {modifyLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
              Modificar y enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nuevo Turno */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nombre del cliente</Label>
                <Input 
                  value={newData.customerName} 
                  onChange={(e) => setNewData({...newData, customerName: e.target.value})}
                  placeholder="Nicolas Percio"
                  className="mt-1 dark:bg-zinc-800"
                />
              </div>
              <div className="col-span-2">
                <Label>Teléfono</Label>
                <Input 
                  value={newData.customerPhone} 
                  onChange={(e) => setNewData({...newData, customerPhone: e.target.value})}
                  placeholder="5491112345678"
                  className="mt-1 dark:bg-zinc-800"
                />
              </div>
              <div>
                <Label>Fecha</Label>
                <Input 
                  type="date" 
                  value={newData.date} 
                  onChange={(e) => setNewData({...newData, date: e.target.value})}
                  className="mt-1 dark:bg-zinc-800"
                />
              </div>
              <div>
                <Label>Hora</Label>
                <Input 
                  type="time" 
                  value={newData.time} 
                  onChange={(e) => setNewData({...newData, time: e.target.value})}
                  className="mt-1 dark:bg-zinc-800"
                />
              </div>
              
              {/* Categoría + Modelo */}
              <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Categoría</Label>
                  <div className="flex gap-2 mt-1">
                    <Select value={selectedCategory} onValueChange={(v: 'PHONE' | 'ACCESSORY') => {
                      setSelectedCategory(v);
                      setNewData({...newData, product: ''});
                    }}>
                      <SelectTrigger className="dark:bg-zinc-800 flex-1">
                        <SelectValue placeholder="Elegí categoría..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PHONE">📱 iPhone</SelectItem>
                        <SelectItem value="ACCESSORY">🎧 Accesorio</SelectItem>
                      </SelectContent>
                    </Select>
                    <ImeiScanner 
                      onScan={(imei) => {
                        // Buscar producto por IMEI y auto-seleccionar
                        const token = Cookies.get('token');
                        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/products/imei/${imei}`, {
                          headers: { Authorization: `Bearer ${token}` }
                        }).then(res => {
                          if (res.data.found && res.data.data) {
                            const productName = `${res.data.data.model || ''} ${res.data.data.storage || ''}`.trim();
                            setSelectedCategory('PHONE');
                            setNewData(prev => ({...prev, product: productName}));
                            toast.success(`Producto: ${productName}`);
                          } else {
                            toast.error('IMEI no reconocido');
                          }
                        }).catch(() => toast.error('Error al buscar IMEI'));
                      }}
                    />
                  </div>
                </div>

                {/* Modelo */}
                <div>
                  <Label>Modelo</Label>
                  <Select 
                    value={selectedModel} 
                    onValueChange={(v) => setSelectedModel(v)}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger className="dark:bg-zinc-800 mt-1">
                      <SelectValue placeholder={selectedCategory ? "Elegí modelo..." : "Elegí categoría primero"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {getAvailableModels().map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Color, Storage, Batería */}
              <div className="col-span-2">
                <Label className="mb-2 block">Especificaciones</Label>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">

                  {/* Color */}
                  {selectedModel && getAvailableColors().length > 0 && (
                    <Select 
                      value={selectedColor} 
                      onValueChange={(v) => setSelectedColor(v)}
                    >
                      <SelectTrigger className="dark:bg-zinc-800">
                        <SelectValue placeholder="Color" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableColors().map((color) => (
                          <SelectItem key={color || ''} value={color || ''}>
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Storage */}
                  {selectedModel && getAvailableStorages().length > 0 && (
                    <Select 
                      value={selectedStorage} 
                      onValueChange={(v) => setSelectedStorage(v)}
                    >
                      <SelectTrigger className="dark:bg-zinc-800">
                        <SelectValue placeholder="GB" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableStorages().map((storage) => (
                          <SelectItem key={storage} value={storage}>
                            {storage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Batería */}
                  {selectedModel && (
                    <Select 
                      value={selectedBattery} 
                      onValueChange={(v) => setSelectedBattery(v)}
                      disabled={getAvailableBatteries().length === 0}
                    >
                      <SelectTrigger className="dark:bg-zinc-800">
                        <SelectValue placeholder="Batería" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableBatteries().length > 0 ? (
                          getAvailableBatteries().map((battery) => (
                            <SelectItem key={battery} value={String(battery)}>
                              {battery}%
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No hay opciones</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Preview del producto seleccionado */}
                {newData.product && (
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 p-2 rounded mt-2">
                    Producto: <span className="font-medium text-zinc-900 dark:text-zinc-100">{newData.product}</span>
                  </div>
                )}
              </div>

              {/* Productos adicionales para mayorista */}
              {newData.customerType === 'MAYORISTA' && (
                <div className="col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-purple-400">📦 Productos mayorista adicionales</Label>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-xs text-purple-400 hover:text-purple-300"
                      onClick={addMayoristaProduct}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar categoría
                    </Button>
                  </div>
                  
                  {mayoristaProducts.length > 0 && (
                    <div className="space-y-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                      {mayoristaProducts.map((mp, idx) => (
                        <div key={idx} className="space-y-2 p-3 bg-zinc-900/50 rounded border border-purple-500/30">
                          <div className="flex gap-2 items-center">
                            {/* Categoría */}
                            <Select 
                              value={mp.category} 
                              onValueChange={(v: 'PHONE' | 'ACCESSORY') => updateMayoristaProduct(idx, 'category', v)}
                            >
                              <SelectTrigger className="dark:bg-zinc-800 w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PHONE">📱 iPhone</SelectItem>
                                <SelectItem value="ACCESSORY">🎧 Accesorio</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            {/* Botón eliminar */}
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-red-400 hover:text-red-500 ml-auto"
                              onClick={() => removeMayoristaProduct(idx)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Modelo */}
                          <Select 
                            value={mp.model} 
                            onValueChange={(v) => updateMayoristaProduct(idx, 'model', v)}
                          >
                            <SelectTrigger className="dark:bg-zinc-800">
                              <SelectValue placeholder="1. Elegí modelo..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {getMayoristaModels(mp.category).map((model) => (
                                <SelectItem key={model} value={model}>
                                  {model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {/* Color */}
                          {mp.model && getMayoristaColors(mp.category, mp.model).length > 0 && (
                            <Select 
                              value={mp.color} 
                              onValueChange={(v) => updateMayoristaProduct(idx, 'color', v)}
                            >
                              <SelectTrigger className="dark:bg-zinc-800">
                                <SelectValue placeholder="2. Elegí color..." />
                              </SelectTrigger>
                              <SelectContent>
                                {getMayoristaColors(mp.category, mp.model).map((color) => (
                                  <SelectItem key={color || ''} value={color || ''}>
                                    {color}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          
                          {/* Storage */}
                          {mp.model && getMayoristaStorages(mp.category, mp.model, mp.color).length > 0 && (
                            <Select 
                              value={mp.storage} 
                              onValueChange={(v) => updateMayoristaProduct(idx, 'storage', v)}
                            >
                              <SelectTrigger className="dark:bg-zinc-800">
                                <SelectValue placeholder="3. Elegí almacenamiento..." />
                              </SelectTrigger>
                              <SelectContent>
                                {getMayoristaStorages(mp.category, mp.model, mp.color).map((storage) => (
                                  <SelectItem key={storage} value={storage}>
                                    {storage}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          
                          {/* Batería */}
                          {mp.model && mp.storage && getMayoristaBatteries(mp.category, mp.model, mp.color, mp.storage).length > 0 && (
                            <Select 
                              value={mp.battery} 
                              onValueChange={(v) => updateMayoristaProduct(idx, 'battery', v)}
                            >
                              <SelectTrigger className="dark:bg-zinc-800">
                                <SelectValue placeholder="4. Elegí batería (opcional)..." />
                              </SelectTrigger>
                              <SelectContent>
                                {getMayoristaBatteries(mp.category, mp.model, mp.color, mp.storage).map((battery) => (
                                  <SelectItem key={battery} value={String(battery)}>
                                    {battery}%
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          
                          {/* Cantidad (solo para accesorios) */}
                          {mp.category === 'ACCESSORY' && mp.model && (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Cantidad:</Label>
                              <Input 
                                type="number" 
                                min={1}
                                value={mp.quantity}
                                onChange={(e) => updateMayoristaProduct(idx, 'quantity', parseInt(e.target.value) || 1)}
                                className="dark:bg-zinc-800 w-20"
                              />
                            </div>
                          )}
                          
                          {/* Preview */}
                          {buildMayoristaProductString(mp) && (
                            <div className="text-xs text-purple-300 bg-purple-900/30 p-2 rounded">
                              {buildMayoristaProductString(mp)}
                              {mp.category === 'ACCESSORY' && mp.quantity > 1 && ` x${mp.quantity}`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {mayoristaProducts.length === 0 && (
                    <p className="text-xs text-zinc-500">Usá el producto principal arriba o agregá más categorías de productos</p>
                  )}
                </div>
              )}

              {/* Métodos de pago */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <Label>Forma de pago</Label>
                  {newData.paymentMethods.length < 4 && (
                    <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={addPaymentMethod}>
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {newData.paymentMethods.map((pm, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Select value={pm} onValueChange={(v) => updatePaymentMethod(idx, v)}>
                        <SelectTrigger className="dark:bg-zinc-800 flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH_USD">Efectivo USD</SelectItem>
                          <SelectItem value="CASH_ARS">Efectivo ARS</SelectItem>
                          <SelectItem value="TRANSFER">Transferencia</SelectItem>
                          <SelectItem value="USDT_BINANCE">USDT</SelectItem>
                        </SelectContent>
                      </Select>
                      {newData.paymentMethods.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-500" onClick={() => removePaymentMethod(idx)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tipo de cliente */}
              <div>
                <Label>Tipo de cliente</Label>
                <Select value={newData.customerType} onValueChange={(v: 'MAYORISTA' | 'MINORISTA') => setNewData({...newData, customerType: v})}>
                  <SelectTrigger className="mt-1 dark:bg-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MINORISTA">🛒 Minorista</SelectItem>
                    <SelectItem value="MAYORISTA">📦 Mayorista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sucursal */}
              <div>
                <Label>Sucursal</Label>
                <Select value={newData.storeId} onValueChange={(v) => setNewData({...newData, storeId: v})}>
                  <SelectTrigger className="mt-1 dark:bg-zinc-800">
                    <SelectValue placeholder="Elegí sucursal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewOpen(false)}>Cancelar</Button>
            <Button onClick={createAppointment} disabled={newLoading || !newData.customerName || !newData.customerPhone}>
              {newLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Crear turno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmación Horario Fuera de Rango */}
      <Dialog open={scheduleWarningOpen} onOpenChange={setScheduleWarningOpen}>
        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-500">
              <Clock className="h-5 w-5" />
              {scheduleWarningMsg.includes('ya pasó') ? 'Horario inválido' : 'Horario fuera de rango'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-zinc-300">{scheduleWarningMsg}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleWarningOpen(false)}>
              {scheduleWarningMsg.includes('ya pasó') ? 'Entendido' : 'Cancelar'}
            </Button>
            {!scheduleWarningMsg.includes('ya pasó') && (
              <Button onClick={() => doCreateAppointment(true)} disabled={newLoading} className="bg-yellow-600 hover:bg-yellow-700">
                {newLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                Crear igual
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirmación Eliminar */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-5 w-5" />
              Eliminar turnos
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              ¿Estás seguro que querés eliminar {selectedIds.size} {selectedIds.size === 1 ? 'turno' : 'turnos'}? Esta acción no se puede deshacer.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={deleteSelected} disabled={deleteLoading}>
              {deleteLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Conflicto de Horario */}
      <Dialog open={conflictOpen} onOpenChange={setConflictOpen}>
        <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-500">
              <Clock className="h-5 w-5" />
              Horario ocupado
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{conflictData?.message}</p>
            
            {conflictData?.alternatives && conflictData.alternatives.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">Horarios disponibles cercanos:</p>
                <div className="flex gap-2">
                  {conflictData.alternatives.map((time) => (
                    <Button
                      key={time}
                      variant="outline"
                      className="flex-1 font-mono"
                      onClick={() => selectAlternativeTime(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setConflictOpen(false)} className="flex-1">
              Volver
            </Button>
            <Button 
              onClick={() => doCreateAppointment(true)} 
              disabled={newLoading}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700"
            >
              {newLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Crear igual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Conversación */}
      <ConversationModal
        open={conversationOpen}
        onClose={() => setConversationOpen(false)}
        customerPhone={conversationPhone}
        customerName={conversationName}
      />
    </div>
  );
}


// Main export - checks locale for appointments feature
export default function TurnosPage() {
  const { locale } = useTranslation();
  const localeFeatures = getFeaturesForLocale(locale);
  
  // Appointments only available in Spanish
  if (!localeFeatures.appointments) {
    return <AppointmentsDisabledMessage />;
  }
  
  return <TurnosPageContent />;
}
