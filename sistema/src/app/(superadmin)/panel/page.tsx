'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Bot,
  DollarSign,
  Calendar,
  Pause,
  Play,
  Trash2,
  CreditCard,
  Clock,
  Search,
  AlertCircle,
  Zap,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Tenant {
  id: string;
  name: string;
  plan: string;
  planPrice: number;
  planExpires: string;
  paymentStatus: string;
  active: boolean;
  createdAt: string;
  lastActivityAt?: string;
  locale?: string;
  phone?: string;
}

interface Payment {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  notes: string;
  paidAt: string;
  createdAt: string;
}

interface AIStats {
  messagesToday: number;
  messagesMonth: number;
  totalConversations: number;
  estimatedTokens: number;
  estimatedCost: string;
  botEnabled: boolean;
  tenantName: string;
}

export default function SuperAdminPanel() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [showIAModal, setShowIAModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showToggleAIModal, setShowToggleAIModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [newPlan, setNewPlan] = useState<string>('');
  const [changePlanPassword, setChangePlanPassword] = useState('');
  const [aiToggleAction, setAiToggleAction] = useState<boolean>(false);
  const [aiTogglePassword, setAiTogglePassword] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [aiStats, setAiStats] = useState<AIStats | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingAIStats, setLoadingAIStats] = useState(false);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [newPaymentNotes, setNewPaymentNotes] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('');
  const [extendDays, setExtendDays] = useState(0);
  const [deletePassword, setDeletePassword] = useState('');
  const [togglePassword, setTogglePassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  const getToken = () => Cookies.get('token');

  useEffect(() => {
    fetchTenants();
    fetchMonthlyRevenue();
  }, []);

  const fetchMonthlyRevenue = async () => {
    try {
      const res = await fetch(`${API}/tenants/revenue/monthly`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setMonthlyRevenue(data.totalRevenue || 0);
    } catch (error) {
      console.error('Error al cargar facturación:', error);
    }
  };

  const fetchTenants = async () => {
    try {
      const res = await fetch(`${API}/tenants`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      // Filtrar el tenant del super admin (slug: 'superadmin' o 'admin')
      const filteredData = Array.isArray(data) 
        ? data.filter(t => t.slug !== 'superadmin' && t.slug !== 'admin' && t.slug !== 'sistema')
        : [];
      setTenants(filteredData);
    } catch (error) {
      console.error('Error al cargar negocios:', error);
      toast.error('Error al cargar negocios');
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (expiresDate: string | null) => {
    if (!expiresDate) return null;
    const expires = new Date(expiresDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalizar a medianoche
    expires.setHours(0, 0, 0, 0);
    const diff = expires.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const toggleActive = async () => {
    if (!selectedTenant) return;
    
    setProcessing(true);
    try {
      // Verificar contraseña
      const verifyRes = await fetch(`${API}/auth/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ password: togglePassword })
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyData.valid) {
        toast.error('Contraseña incorrecta');
        setProcessing(false);
        return;
      }

      const endpoint = selectedTenant.active ? 'deactivate' : 'activate';
      const res = await fetch(`${API}/tenants/${selectedTenant.id}/${endpoint}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      
      if (!res.ok) throw new Error();
      
      toast.success(selectedTenant.active ? 'Negocio pausado' : 'Negocio activado');
      setShowToggleModal(false);
      setTogglePassword('');
      fetchTenants();
    } catch {
      toast.error('Error al cambiar estado');
    } finally {
      setProcessing(false);
    }
  };

  const openPaymentModal = async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setNewPlanPrice(tenant.planPrice?.toString() || '');
    setShowPaymentModal(true);
    await fetchPayments(tenant.id);
  };

  const openIAModal = async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowIAModal(true);
    await fetchAIStats(tenant.id);
  };

  const fetchAIStats = async (tenantId: string) => {
    setLoadingAIStats(true);
    try {
      const res = await fetch(`${API}/tenants/${tenantId}/ai-stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setAiStats(data);
    } catch (error) {
      console.error('Error al cargar estadísticas de IA:', error);
      toast.error('Error al cargar estadísticas');
      setAiStats(null);
    } finally {
      setLoadingAIStats(false);
    }
  };

  const openToggleAIModal = (enabled: boolean) => {
    setAiToggleAction(enabled);
    setShowToggleAIModal(true);
  };

  const toggleAI = async () => {
    if (!selectedTenant) return;

    setProcessing(true);
    try {
      // Verificar contraseña
      const verifyRes = await fetch(`${API}/auth/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ password: aiTogglePassword })
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyData.valid) {
        toast.error('Contraseña incorrecta');
        setProcessing(false);
        return;
      }

      const res = await fetch(`${API}/tenants/${selectedTenant.id}/ai-toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ enabled: aiToggleAction }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || 'Error al cambiar estado de IA');
        setProcessing(false);
        return;
      }

      toast.success(aiToggleAction ? 'IA activada' : 'IA pausada');
      setShowToggleAIModal(false);
      setAiTogglePassword('');
      await fetchAIStats(selectedTenant.id);
      await fetchTenants();
    } catch (error) {
      console.error('Error al cambiar estado de IA:', error);
      toast.error('Error al cambiar estado de IA');
    } finally {
      setProcessing(false);
    }
  };

  const fetchPayments = async (tenantId: string) => {
    setLoadingPayments(true);
    try {
      const res = await fetch(`${API}/tenants/${tenantId}/payments`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      toast.error('Error al cargar historial de pagos');
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleRegisterPayment = async () => {
    if (!selectedTenant || !newPaymentAmount || parseFloat(newPaymentAmount) <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`${API}/tenants/${selectedTenant.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          amount: parseFloat(newPaymentAmount),
          method: newPaymentMethod || 'Efectivo',
          notes: newPaymentNotes || null,
          extendDays: 30 // Extender 30 días por defecto
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || 'Error al registrar pago');
        setProcessing(false);
        return;
      }

      toast.success('Pago registrado (+30 días)');
      setNewPaymentAmount('');
      setNewPaymentMethod('');
      setNewPaymentNotes('');
      await fetchPayments(selectedTenant.id);
      await fetchTenants();
      await fetchMonthlyRevenue(); // Actualizar facturación
    } catch (error) {
      console.error('Error al registrar pago:', error);
      toast.error('Error al registrar pago');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!selectedTenant || !newPlanPrice || parseFloat(newPlanPrice) < 0) {
      toast.error('Ingresa un precio válido');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`${API}/tenants/${selectedTenant.id}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ planPrice: parseFloat(newPlanPrice) }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || 'Error al actualizar precio');
        setProcessing(false);
        return;
      }

      toast.success('Precio actualizado');
      await fetchTenants();
    } catch (error) {
      console.error('Error al actualizar precio:', error);
      toast.error('Error al actualizar precio');
    } finally {
      setProcessing(false);
    }
  };

  const handleExtend = async () => {
    if (!selectedTenant || extendDays <= 0) {
      toast.error('Ingresa días válidos');
      return;
    }
    
    setProcessing(true);
    try {
      const currentExpires = selectedTenant.planExpires ? new Date(selectedTenant.planExpires) : new Date();
      const newExpires = new Date(currentExpires);
      newExpires.setDate(newExpires.getDate() + extendDays);

      const res = await fetch(`${API}/tenants/${selectedTenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ 
          planExpires: newExpires.toISOString(),
          paymentStatus: 'expired' // Marcar como expirado con acceso extendido
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Error al extender:', errorData);
        toast.error(errorData.error || 'Error al extender plan');
        setProcessing(false);
        return;
      }
      
      toast.success(`Plan extendido +${extendDays} días`);
      setShowExtendModal(false);
      setExtendDays(0);
      setSelectedTenant(null);
      await fetchTenants();
    } catch (error) {
      console.error('Error al extender:', error);
      toast.error('Error al extender plan');
    } finally {
      setProcessing(false);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedTenant || !newPlan) {
      toast.error('Selecciona un plan');
      return;
    }

    setProcessing(true);
    try {
      // Verificar contraseña
      const verifyRes = await fetch(`${API}/auth/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ password: changePlanPassword })
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyData.valid) {
        toast.error('Contraseña incorrecta');
        setProcessing(false);
        return;
      }

      // Cambiar plan
      const res = await fetch(`${API}/tenants/${selectedTenant.id}/plan`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ plan: newPlan }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || 'Error al cambiar plan');
        setProcessing(false);
        return;
      }

      toast.success(`Plan cambiado a ${newPlan.toUpperCase()}`);
      setShowChangePlanModal(false);
      setChangePlanPassword('');
      setNewPlan('');
      await fetchTenants();
    } catch (error) {
      console.error('Error al cambiar plan:', error);
      toast.error('Error al cambiar plan');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTenant) return;
    
    setProcessing(true);
    try {
      // Verificar contraseña
      const verifyRes = await fetch(`${API}/auth/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ password: deletePassword })
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyData.valid) {
        toast.error('Contraseña incorrecta');
        setProcessing(false);
        return;
      }

      // Eliminar tenant
      console.log('Eliminando tenant:', selectedTenant.id);
      const res = await fetch(`${API}/tenants/${selectedTenant.id}/permanent`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Error del servidor:', errorData);
        toast.error(errorData.error || 'Error al eliminar negocio');
        setProcessing(false);
        return;
      }
      
      toast.success('Negocio eliminado correctamente');
      setShowDeleteModal(false);
      setDeletePassword('');
      setSelectedTenant(null);
      await fetchTenants();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar negocio');
    } finally {
      setProcessing(false);
    }
  };

  const handleMigration = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`${API}/tenants/migrate-free-to-trial`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || 'Error en migración');
        setProcessing(false);
        return;
      }

      toast.success('Migración completada exitosamente');
      setShowMigrationModal(false);
      await fetchTenants();
    } catch (error) {
      console.error('Error en migración:', error);
      toast.error('Error al ejecutar migración');
    } finally {
      setProcessing(false);
    }
  };

  const filteredTenants = Array.isArray(tenants) ? tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const stats = {
    total: Array.isArray(tenants) ? tenants.length : 0,
    active: Array.isArray(tenants) ? tenants.filter(t => t.active).length : 0,
    trial: Array.isArray(tenants) ? tenants.filter(t => t.plan === 'trial').length : 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Building2 className="w-8 h-8 text-zinc-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Activos</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <Zap className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">En Trial</p>
                <p className="text-2xl font-bold">{stats.trial}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Facturación Mes</p>
                <p className="text-2xl font-bold">${monthlyRevenue.toLocaleString('es-AR')}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <Input
            placeholder="Buscar negocio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setShowMigrationModal(true)}
          variant="outline"
          className="gap-2"
        >
          <AlertCircle className="w-4 h-4" />
          Migrar FREE → TRIAL
        </Button>
        <Button
          onClick={() => router.push('/panel/nuevo-negocio')}
          className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
        >
          <Plus className="w-4 h-4" />
          Nuevo Negocio
        </Button>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Negocio</TableHead>
              <TableHead className="w-[140px]">Teléfono</TableHead>
              <TableHead className="w-[80px]">Plan</TableHead>
              <TableHead className="w-[90px]">Estado</TableHead>
              <TableHead className="w-[70px]">Idioma</TableHead>
              <TableHead className="w-[90px] whitespace-nowrap">Días rest.</TableHead>
              <TableHead className="w-[90px] whitespace-nowrap">Cons. IA</TableHead>
              <TableHead className="w-[100px] whitespace-nowrap">Últ. activ.</TableHead>
              <TableHead className="text-right w-[200px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTenants.map((tenant) => {
              const daysLeft = tenant.planExpires ? getDaysLeft(tenant.planExpires) : null;
              const isExpired = daysLeft !== null && daysLeft <= 0;
              const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

              return (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    {tenant.phone || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={
                        tenant.plan === 'trial' 
                          ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
                          : tenant.plan === 'basic'
                          ? 'border-blue-500 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : tenant.plan === 'pro'
                          ? 'border-purple-500 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
                          : ''
                      }
                    >
                      {tenant.plan.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tenant.active ? 'default' : 'secondary'}>
                      {tenant.active ? 'Activo' : 'Pausado'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {tenant.locale === 'en' ? '🇺🇸 EN' : '🇦🇷 ES'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {daysLeft !== null ? (
                      <span className={`whitespace-nowrap ${
                        isExpired ? 'text-red-600 font-semibold' :
                        isExpiringSoon ? 'text-yellow-600 font-semibold' :
                        'text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {isExpired ? `Vencido (${Math.abs(daysLeft)}d)` : `${daysLeft}d`}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-zinc-500 whitespace-nowrap">-</TableCell>
                  <TableCell className="text-zinc-500 whitespace-nowrap">
                    {tenant.lastActivityAt 
                      ? (() => {
                          const now = new Date();
                          const lastActivity = new Date(tenant.lastActivityAt);
                          const diffMs = now.getTime() - lastActivity.getTime();
                          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                          
                          // Si la última actividad es del mismo día
                          if (diffDays === 0) {
                            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                            // Solo mostrar "Hoy" si fue hace menos de 12 horas
                            if (diffHours < 12) return 'Hoy';
                            return `Hace ${diffHours}h`;
                          }
                          if (diffDays === 1) return 'Ayer';
                          if (diffDays < 7) return `Hace ${diffDays}d`;
                          if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)}sem`;
                          return `Hace ${Math.floor(diffDays / 30)}m`;
                        })()
                      : 'Nunca'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setNewPlan(tenant.plan);
                          setShowChangePlanModal(true);
                        }}
                        title="Cambiar plan"
                      >
                        <TrendingUp className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openIAModal(tenant)}
                        title="Ver IA"
                      >
                        <Bot className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setShowExtendModal(true);
                        }}
                        title="Extender días"
                      >
                        <Clock className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openPaymentModal(tenant)}
                        title="Pagos"
                      >
                        <CreditCard className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setShowToggleModal(true);
                        }}
                        title={tenant.active ? 'Pausar' : 'Activar'}
                      >
                        {tenant.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setShowDeleteModal(true);
                        }}
                        title="Eliminar"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredTenants.length === 0 && (
          <div className="p-12 text-center text-zinc-500">
            No se encontraron negocios
          </div>
        )}
      </Card>

      {/* Modal: Extender días */}
      <Dialog open={showExtendModal} onOpenChange={setShowExtendModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extender plan</DialogTitle>
            <DialogDescription>
              {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setExtendDays(3)}
                className={extendDays === 3 ? 'border-blue-500' : ''}
              >
                +3 días
              </Button>
              <Button
                variant="outline"
                onClick={() => setExtendDays(7)}
                className={extendDays === 7 ? 'border-blue-500' : ''}
              >
                +7 días
              </Button>
              <Button
                variant="outline"
                onClick={() => setExtendDays(15)}
                className={extendDays === 15 ? 'border-blue-500' : ''}
              >
                +15 días
              </Button>
            </div>

            <div>
              <Input
                type="number"
                placeholder="O ingresa días personalizados"
                value={extendDays || ''}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExtendModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExtend} disabled={processing || extendDays <= 0}>
              {processing ? 'Extendiendo...' : 'Extender'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Pausar/Activar */}
      <Dialog open={showToggleModal} onOpenChange={setShowToggleModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedTenant?.active ? 'Pausar negocio' : 'Activar negocio'}
            </DialogTitle>
            <DialogDescription>
              {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {selectedTenant?.active 
                  ? 'El negocio no podrá acceder al sistema hasta que lo actives nuevamente.'
                  : 'El negocio podrá acceder al sistema nuevamente.'}
              </p>
            </div>

            <div>
              <Input
                type="password"
                placeholder="Tu contraseña para confirmar"
                value={togglePassword}
                onChange={(e) => setTogglePassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowToggleModal(false);
              setTogglePassword('');
            }}>
              Cancelar
            </Button>
            <Button
              onClick={toggleActive}
              disabled={processing || !togglePassword}
            >
              {processing ? 'Procesando...' : selectedTenant?.active ? 'Pausar' : 'Activar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Ver IA */}
      <Dialog open={showIAModal} onOpenChange={setShowIAModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              Estadísticas de IA
            </DialogTitle>
            <DialogDescription>
              {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          
          {loadingAIStats ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900 dark:border-white"></div>
            </div>
          ) : aiStats ? (
            <div className="space-y-4">
              {/* Estado de la IA */}
              <div className={`p-3 rounded-lg border ${
                aiStats.botEnabled 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Estado de la IA</p>
                    <p className={`text-xs ${
                      aiStats.botEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {aiStats.botEnabled ? 'Activa' : 'Pausada'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={aiStats.botEnabled ? 'destructive' : 'default'}
                    onClick={() => openToggleAIModal(!aiStats.botEnabled)}
                    disabled={processing}
                  >
                    {processing ? 'Procesando...' : aiStats.botEnabled ? 'Pausar' : 'Activar'}
                  </Button>
                </div>
              </div>

              {/* Mensajes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Mensajes hoy</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {aiStats.messagesToday}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Mensajes mes</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {aiStats.messagesMonth}
                  </p>
                </div>
              </div>

              {/* Tokens y conversaciones */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Tokens mes</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {aiStats.estimatedTokens.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Conversaciones</p>
                  <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                    {aiStats.totalConversations}
                  </p>
                </div>
              </div>

              {/* Costo */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Costo estimado (mes)</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${aiStats.estimatedCost}                  
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                No se pudieron cargar las estadísticas
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIAModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar Pausar/Activar IA */}
      <Dialog open={showToggleAIModal} onOpenChange={setShowToggleAIModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-orange-600 dark:text-orange-500">
              {aiToggleAction ? 'Activar IA' : 'Pausar IA'}
            </DialogTitle>
            <DialogDescription>
              {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className={`p-3 rounded-lg border ${
              aiToggleAction 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
            }`}>
              <p className={`text-sm ${
                aiToggleAction 
                  ? 'text-green-800 dark:text-green-200'
                  : 'text-orange-800 dark:text-orange-200'
              }`}>
                {aiToggleAction 
                  ? 'El bot de IA volverá a responder mensajes automáticamente.'
                  : 'El bot de IA dejará de responder mensajes automáticamente.'}
              </p>
            </div>

            <div>
              <Input
                type="password"
                placeholder="Tu contraseña para confirmar"
                value={aiTogglePassword}
                onChange={(e) => setAiTogglePassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowToggleAIModal(false);
              setAiTogglePassword('');
            }}>
              Cancelar
            </Button>
            <Button
              variant={aiToggleAction ? 'default' : 'destructive'}
              onClick={toggleAI}
              disabled={processing || !aiTogglePassword}
            >
              {processing ? 'Procesando...' : aiToggleAction ? 'Activar' : 'Pausar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Pagos */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Gestión de Pagos
            </DialogTitle>
            <DialogDescription>
              {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Precio del plan */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Precio mensual del plan
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Precio"
                  value={newPlanPrice}
                  onChange={(e) => setNewPlanPrice(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleUpdatePrice} disabled={processing} size="sm">
                  {processing ? 'Guardando...' : 'Actualizar'}
                </Button>
              </div>
            </div>

            {/* Registrar nuevo pago */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-3">
                Registrar nuevo pago
              </p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Monto"
                    value={newPaymentAmount}
                    onChange={(e) => setNewPaymentAmount(e.target.value)}
                  />
                  <Input
                    placeholder="Método (ej: Efectivo)"
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Notas (opcional)"
                  value={newPaymentNotes}
                  onChange={(e) => setNewPaymentNotes(e.target.value)}
                />
                <Button 
                  onClick={handleRegisterPayment} 
                  disabled={processing || !newPaymentAmount}
                  className="w-full"
                >
                  {processing ? 'Registrando...' : 'Registrar Pago (+30 días)'}
                </Button>
              </div>
            </div>

            {/* Historial de pagos */}
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-white mb-3">
                Historial de pagos
              </p>
              {loadingPayments ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-zinc-900 dark:border-white"></div>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  No hay pagos registrados
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="text-sm">
                            {new Date(payment.paidAt).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="font-medium text-green-600 dark:text-green-400">
                            ${payment.amount.toLocaleString('es-AR')}
                          </TableCell>
                          <TableCell className="text-sm">{payment.method}</TableCell>
                          <TableCell className="text-sm text-zinc-500">
                            {payment.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Total */}
              {payments.length > 0 && (
                <div className="mt-3 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-medium">Total recaudado:</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('es-AR')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Cambiar Plan */}
      <Dialog open={showChangePlanModal} onOpenChange={setShowChangePlanModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Cambiar Plan
            </DialogTitle>
            <DialogDescription>
              {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Plan actual: <span className="font-semibold">{selectedTenant?.plan.toUpperCase()}</span>
              </p>
              <div className="space-y-2">
                <Button
                  variant={newPlan === 'trial' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setNewPlan('trial')}
                >
                  <span className="flex-1 text-left">Trial (14 días gratis)</span>
                  {newPlan === 'trial' && <span className="text-xs">✓</span>}
                </Button>
                <Button
                  variant={newPlan === 'basic' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setNewPlan('basic')}
                >
                  <span className="flex-1 text-left">Básico</span>
                  {newPlan === 'basic' && <span className="text-xs">✓</span>}
                </Button>
                <Button
                  variant={newPlan === 'pro' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setNewPlan('pro')}
                >
                  <span className="flex-1 text-left">Profesional</span>
                  {newPlan === 'pro' && <span className="text-xs">✓</span>}
                </Button>
              </div>
            </div>

            <div>
              <Input
                type="password"
                placeholder="Tu contraseña para confirmar"
                value={changePlanPassword}
                onChange={(e) => setChangePlanPassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowChangePlanModal(false);
              setChangePlanPassword('');
              setNewPlan('');
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleChangePlan}
              disabled={processing || !changePlanPassword || !newPlan || newPlan === selectedTenant?.plan}
            >
              {processing ? 'Cambiando...' : 'Cambiar Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Eliminar */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-500">
              Eliminar negocio
            </DialogTitle>
            <DialogDescription>
              {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                Se eliminarán todos los datos del negocio permanentemente.
              </p>
            </div>

            <div>
              <Input
                type="password"
                placeholder="Tu contraseña para confirmar"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteModal(false);
              setDeletePassword('');
            }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={processing || !deletePassword}
            >
              {processing ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Migración FREE → TRIAL */}
      <Dialog open={showMigrationModal} onOpenChange={setShowMigrationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Migrar FREE → TRIAL
            </DialogTitle>
            <DialogDescription>
              Unificar planes y corregir fechas de expiración
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2 font-medium">
                Esta migración va a:
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Cambiar todos los planes "FREE" a "TRIAL"</li>
                <li>Setear planExpires en trials (14 días desde creación)</li>
                <li>Setear planExpires en planes pagos (desde nextPaymentDate)</li>
                <li>Limpiar lastActivityAt en tenants sin usuarios</li>
              </ul>
            </div>

            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Esta operación puede tardar unos segundos. No cierres esta ventana.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMigrationModal(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button
              onClick={handleMigration}
              disabled={processing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {processing ? 'Migrando...' : 'Ejecutar Migración'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
