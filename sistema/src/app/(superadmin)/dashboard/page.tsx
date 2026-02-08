'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Trash2,
  Eye,
  Edit,
  CreditCard,
  Shield,
  Activity,
  BarChart3,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import TenantDetailModal from '@/components/superadmin/TenantDetailModal';

const API = process.env.NEXT_PUBLIC_API_URL;

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  plan: string;
  planPrice: number;
  planStartDate: string;
  planExpires: string;
  paymentStatus: string;
  active: boolean;
  createdAt: string;
  notes: string;
  _count?: {
    users: number;
    products: number;
    sales: number;
  };
}

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'overdue'>('all');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const getToken = () => Cookies.get('token');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await fetch(`${API}/tenants`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      setTenants(data);
    } catch (error) {
      toast.error('Error al cargar negocios');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (tenant: Tenant) => {
    if (!tenant.active) return 'bg-gray-500';
    if (tenant.paymentStatus === 'overdue') return 'bg-red-500';
    if (tenant.paymentStatus === 'pending') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = (tenant: Tenant) => {
    if (!tenant.active) return 'Inactivo';
    if (tenant.paymentStatus === 'overdue') return 'Vencido';
    if (tenant.paymentStatus === 'pending') return 'Pendiente';
    return 'Activo';
  };

  const getDaysUntilExpiration = (expiresDate: string) => {
    const expires = new Date(expiresDate);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'active') return matchesSearch && tenant.active && tenant.paymentStatus === 'paid';
    if (filterStatus === 'inactive') return matchesSearch && !tenant.active;
    if (filterStatus === 'overdue') return matchesSearch && tenant.paymentStatus === 'overdue';
    
    return matchesSearch;
  });

  const stats = {
    total: tenants.length,
    active: tenants.filter(t => t.active && t.paymentStatus === 'paid').length,
    pending: tenants.filter(t => t.paymentStatus === 'pending').length,
    overdue: tenants.filter(t => t.paymentStatus === 'overdue').length,
    revenue: tenants.reduce((sum, t) => sum + (t.planPrice || 0), 0),
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;
    
    setDeleting(true);
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
        setDeleting(false);
        return;
      }

      // Eliminar tenant
      const response = await fetch(`${API}/tenants/${selectedTenant.id}/permanent`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al eliminar negocio');
        setDeleting(false);
        return;
      }

      toast.success('Negocio eliminado correctamente');
      setShowDeleteModal(false);
      setDeletePassword('');
      setSelectedTenant(null);
      await fetchTenants();
    } catch (error) {
      toast.error('Error al eliminar negocio');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-800 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Panel de Super Admin
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Gestión completa de todos los negocios
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Negocios</p>
                <p className="text-3xl font-bold mt-1">{stats.total}</p>
              </div>
              <Building2 className="w-12 h-12 text-blue-200 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Activos</p>
                <p className="text-3xl font-bold mt-1">{stats.active}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-200 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pendientes</p>
                <p className="text-3xl font-bold mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-200 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Vencidos</p>
                <p className="text-3xl font-bold mt-1">{stats.overdue}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-red-200 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Ingresos/Mes</p>
                <p className="text-3xl font-bold mt-1">${stats.revenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-12 h-12 text-purple-200 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
              >
                Todos
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
              >
                Activos
              </Button>
              <Button
                variant={filterStatus === 'overdue' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('overdue')}
              >
                Vencidos
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('inactive')}
              >
                Inactivos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTenants.map((tenant) => {
          const daysLeft = tenant.planExpires ? getDaysUntilExpiration(tenant.planExpires) : null;
          const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
          const isExpired = daysLeft !== null && daysLeft <= 0;

          return (
            <Card
              key={tenant.id}
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-500 dark:hover:border-blue-400"
              onClick={() => {
                setSelectedTenant(tenant);
                setShowDetailModal(true);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {tenant.name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        @{tenant.slug}
                      </CardDescription>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(tenant)} animate-pulse`} />
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <Badge
                    variant={tenant.active ? 'default' : 'secondary'}
                    className={`${
                      tenant.active
                        ? tenant.paymentStatus === 'paid'
                          ? 'bg-green-500 hover:bg-green-600'
                          : tenant.paymentStatus === 'overdue'
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-yellow-500 hover:bg-yellow-600'
                        : 'bg-gray-500 hover:bg-gray-600'
                    }`}
                  >
                    {getStatusText(tenant)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {tenant.plan.toUpperCase()}
                  </Badge>
                </div>

                {/* Expiration Warning */}
                {isExpiringSoon && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-xs text-yellow-700 dark:text-yellow-300">
                      Vence en {daysLeft} días
                    </span>
                  </div>
                )}

                {isExpired && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-xs text-red-700 dark:text-red-300">
                      Vencido hace {Math.abs(daysLeft!)} días
                    </span>
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{tenant.email}</span>
                  </div>
                  {tenant.phone && (
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <Phone className="w-4 h-4" />
                      <span>{tenant.phone}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                {tenant._count && (
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t dark:border-zinc-700">
                    <div className="text-center">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Usuarios</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">
                        {tenant._count.users}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Productos</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">
                        {tenant._count.products}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Ventas</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">
                        {tenant._count.sales}
                      </p>
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center justify-between pt-3 border-t dark:border-zinc-700">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Plan mensual</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    ${tenant.planPrice?.toLocaleString() || 0}
                  </span>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTenant(tenant);
                      setShowDetailModal(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Editar
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTenants.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron negocios</h3>
            <p className="text-zinc-500 dark:text-zinc-400">
              Intenta cambiar los filtros o el término de búsqueda
            </p>
          </div>
        </Card>
      )}

      {/* Modal de Detalles */}
      {selectedTenant && (
        <TenantDetailModal
          tenant={selectedTenant}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTenant(null);
          }}
          onUpdate={fetchTenants}
          onDelete={(tenant) => {
            setShowDetailModal(false);
            setSelectedTenant(tenant);
            setShowDeleteModal(true);
          }}
        />
      )}

      {/* Modal de Eliminación */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
              <Trash2 className="w-5 h-5" />
              Eliminar Negocio
            </DialogTitle>
            <DialogDescription>
              Esta acción es permanente y no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              ¿Estás seguro de que querés eliminar{' '}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {selectedTenant?.name}
              </span>
              ?
            </p>
            
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 font-semibold mb-2">
                Se eliminarán permanentemente:
              </p>
              <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                <li>Todos los usuarios del negocio</li>
                <li>Todos los productos y ventas</li>
                <li>Todos los clientes y turnos</li>
                <li>Todo el historial y configuraciones</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Ingresa tu contraseña para confirmar
              </label>
              <Input
                type="password"
                placeholder="Tu contraseña"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletePassword('');
                setSelectedTenant(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTenant}
              disabled={deleting || !deletePassword}
            >
              {deleting ? 'Eliminando...' : 'Eliminar Permanentemente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
