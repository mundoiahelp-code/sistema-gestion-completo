'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
  Trash2,
  Shield,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

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

interface Props {
  tenant: Tenant | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: (tenant: Tenant) => void;
}

export default function TenantDetailModal({ tenant, open, onClose, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    planPrice: tenant?.planPrice || 0,
    planExpires: tenant?.planExpires || '',
    notes: tenant?.notes || '',
    graceDays: 0,
  });

  const getToken = () => Cookies.get('token');

  if (!tenant) return null;

  const getDaysUntilExpiration = (expiresDate: string) => {
    const expires = new Date(expiresDate);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysLeft = tenant.planExpires ? getDaysUntilExpiration(tenant.planExpires) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  const isExpired = daysLeft !== null && daysLeft <= 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API}/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          planPrice: formData.planPrice,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar');
      }

      toast.success('Negocio actualizado correctamente');
      setEditing(false);
      onUpdate();
    } catch (error) {
      toast.error('Error al actualizar negocio');
    } finally {
      setSaving(false);
    }
  };

  const handleExtendPlan = async () => {
    if (formData.graceDays <= 0) {
      toast.error('Ingresa días válidos');
      return;
    }

    setSaving(true);
    try {
      const newExpires = new Date(tenant.planExpires || new Date());
      newExpires.setDate(newExpires.getDate() + formData.graceDays);

      const response = await fetch(`${API}/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          planExpires: newExpires.toISOString(),
          paymentStatus: 'paid',
        }),
      });

      if (!response.ok) {
        throw new Error('Error al extender plan');
      }

      toast.success(`Plan extendido por ${formData.graceDays} días`);
      setFormData({ ...formData, graceDays: 0 });
      onUpdate();
    } catch (error) {
      toast.error('Error al extender plan');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async () => {
    try {
      const endpoint = tenant.active ? 'deactivate' : 'activate';
      const response = await fetch(`${API}/tenants/${tenant.id}/${endpoint}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!response.ok) {
        throw new Error('Error al cambiar estado');
      }

      toast.success(tenant.active ? 'Negocio desactivado' : 'Negocio activado');
      onUpdate();
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl">{tenant.name}</DialogTitle>
                <DialogDescription>@{tenant.slug}</DialogDescription>
              </div>
            </div>
            <Badge
              variant={tenant.active ? 'default' : 'secondary'}
              className={`${
                tenant.active
                  ? tenant.paymentStatus === 'paid'
                    ? 'bg-green-500'
                    : tenant.paymentStatus === 'overdue'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                  : 'bg-gray-500'
              }`}
            >
              {tenant.active ? (tenant.paymentStatus === 'paid' ? 'Activo' : tenant.paymentStatus === 'overdue' ? 'Vencido' : 'Pendiente') : 'Inactivo'}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="billing">Facturación</TabsTrigger>
            <TabsTrigger value="actions">Acciones</TabsTrigger>
          </TabsList>

          {/* Tab: Información */}
          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Email</Label>
                <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <Mail className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm">{tenant.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Teléfono</Label>
                <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <Phone className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm">{tenant.phone || 'No especificado'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Plan</Label>
                <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <Shield className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-semibold">{tenant.plan.toUpperCase()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Fecha de creación</Label>
                <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm">
                    {new Date(tenant.createdAt).toLocaleDateString('es-AR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            {tenant._count && (
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Usuarios</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {tenant._count.users}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Productos</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {tenant._count.products}
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Ventas</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {tenant._count.sales}
                  </p>
                </div>
              </div>
            )}

            {/* Notas */}
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500">Notas internas</Label>
              {editing ? (
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas sobre este negocio..."
                  rows={4}
                />
              ) : (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg min-h-[100px]">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {tenant.notes || 'Sin notas'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Facturación */}
          <TabsContent value="billing" className="space-y-4">
            {/* Status de pago */}
            {isExpired && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="font-semibold text-red-700 dark:text-red-300">
                    Plan vencido hace {Math.abs(daysLeft!)} días
                  </span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400">
                  El negocio no puede acceder al sistema. Considera extender el plan o desactivarlo.
                </p>
              </div>
            )}

            {isExpiringSoon && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-semibold text-yellow-700 dark:text-yellow-300">
                    Plan vence en {daysLeft} días
                  </span>
                </div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Contacta al cliente para renovar el plan.
                </p>
              </div>
            )}

            {/* Precio del plan */}
            <div className="space-y-2">
              <Label>Precio mensual</Label>
              {editing ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl">$</span>
                  <Input
                    type="number"
                    value={formData.planPrice}
                    onChange={(e) => setFormData({ ...formData, planPrice: parseFloat(e.target.value) })}
                    className="text-2xl font-bold"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                    ${tenant.planPrice?.toLocaleString() || 0}
                  </span>
                  <span className="text-sm text-zinc-500">/mes</span>
                </div>
              )}
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Inicio del plan</Label>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <p className="text-sm">
                    {tenant.planStartDate
                      ? new Date(tenant.planStartDate).toLocaleDateString('es-AR')
                      : 'No especificado'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Vencimiento</Label>
                <div className={`p-3 rounded-lg ${
                  isExpired
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : isExpiringSoon
                    ? 'bg-yellow-50 dark:bg-yellow-900/20'
                    : 'bg-zinc-50 dark:bg-zinc-800'
                }`}>
                  <p className="text-sm">
                    {tenant.planExpires
                      ? new Date(tenant.planExpires).toLocaleDateString('es-AR')
                      : 'No especificado'}
                  </p>
                </div>
              </div>
            </div>

            {/* Extender plan */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-blue-700 dark:text-blue-300">
                  Extender plan (días de gracia)
                </span>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Dale más tiempo al cliente sin que pague. Útil para pruebas o situaciones especiales.
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Días"
                  value={formData.graceDays || ''}
                  onChange={(e) => setFormData({ ...formData, graceDays: parseInt(e.target.value) || 0 })}
                  min="1"
                />
                <Button onClick={handleExtendPlan} disabled={saving || formData.graceDays <= 0}>
                  {saving ? 'Extendiendo...' : 'Extender'}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Acciones */}
          <TabsContent value="actions" className="space-y-4">
            <div className="space-y-3">
              {/* Activar/Desactivar */}
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold mb-1">
                      {tenant.active ? 'Desactivar negocio' : 'Activar negocio'}
                    </h4>
                    <p className="text-sm text-zinc-500">
                      {tenant.active
                        ? 'El negocio no podrá acceder al sistema'
                        : 'El negocio podrá acceder al sistema nuevamente'}
                    </p>
                  </div>
                  <Button
                    variant={tenant.active ? 'destructive' : 'default'}
                    onClick={toggleActive}
                  >
                    {tenant.active ? 'Desactivar' : 'Activar'}
                  </Button>
                </div>
              </div>

              {/* Marcar como pagado */}
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold mb-1">Marcar como pagado</h4>
                    <p className="text-sm text-zinc-500">
                      Extiende el plan por 30 días y marca como pagado
                    </p>
                  </div>
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={async () => {
                      const nextMonth = new Date();
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      
                      try {
                        const response = await fetch(`${API}/tenants/${tenant.id}`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${getToken()}`,
                          },
                          body: JSON.stringify({
                            planExpires: nextMonth.toISOString(),
                            paymentStatus: 'paid',
                          }),
                        });

                        if (!response.ok) throw new Error('Error');
                        
                        toast.success('Marcado como pagado');
                        onUpdate();
                      } catch (error) {
                        toast.error('Error al marcar como pagado');
                      }
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar pagado
                  </Button>
                </div>
              </div>

              {/* Eliminar */}
              <div className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-red-700 dark:text-red-300 mb-1">
                      Eliminar negocio permanentemente
                    </h4>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Esta acción no se puede deshacer. Se eliminarán todos los datos.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => onDelete(tenant)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button onClick={() => setEditing(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
