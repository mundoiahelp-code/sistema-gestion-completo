'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { 
  Building2, Plus, Loader2, Users, Package, Trash2, Eye, EyeOff, 
  Power, PowerOff, Calendar, DollarSign, Edit, Search,
  CheckCircle, AlertCircle, MoreHorizontal, TrendingUp, Clock, Phone, Mail, Instagram
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  instagram?: string;
  planPrice?: number;
  planStartDate?: string;
  nextPaymentDate?: string;
  notes?: string;
  locale?: string;
  active: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  _count: { users: number; stores: number; products: number; };
}

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newTenant, setNewTenant] = useState({ adminName: '', adminEmail: '', adminPassword: '', planPrice: 0, locale: 'es' });
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; type: 'activate' | 'deactivate' | 'delete'; tenant: Tenant | null; }>({ open: false, type: 'deactivate', tenant: null });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => { fetchTenants(); }, []);

  const getToken = () => Cookies.get('accessToken') || Cookies.get('token');

  const fetchTenants = async () => {
    try {
      const res = await fetch(`${API}/tenants`, { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setTenants((await res.json()).tenants || []);
    } catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  const generateSlug = (name: string) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleCreate = async () => {
    if (!newTenant.adminName || !newTenant.adminEmail || !newTenant.adminPassword) {
      toast.error('Completá todos los campos'); return;
    }
    setCreating(true);
    try {
      const now = new Date();
      const nextMonth = new Date(now); nextMonth.setMonth(nextMonth.getMonth() + 1);
      const res = await fetch(`${API}/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          name: `Negocio de ${newTenant.adminName}`,
          slug: generateSlug(`negocio-${newTenant.adminName}`),
          adminName: newTenant.adminName,
          adminEmail: newTenant.adminEmail,
          adminPassword: newTenant.adminPassword,
          planPrice: newTenant.planPrice,
          planStartDate: now.toISOString(),
          nextPaymentDate: nextMonth.toISOString(),
          locale: newTenant.locale,
        })
      });
      if (res.ok) {
        toast.success('Negocio creado');
        setCreateDialogOpen(false);
        setNewTenant({ adminName: '', adminEmail: '', adminPassword: '', planPrice: 0, locale: 'es' });
        fetchTenants();
      } else toast.error((await res.json()).error || 'Error');
    } catch { toast.error('Error'); }
    finally { setCreating(false); }
  };

  const handleUpdate = async () => {
    if (!selectedTenant) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/tenants/${selectedTenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(selectedTenant)
      });
      if (res.ok) { toast.success('Guardado'); setEditDialogOpen(false); fetchTenants(); }
      else toast.error('Error');
    } catch { toast.error('Error'); }
    finally { setSaving(false); }
  };

  const handleConfirm = async () => {
    if (!confirmDialog.tenant) return;
    setConfirming(true);
    try {
      const verifyRes = await fetch(`${API}/auth/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ password: confirmPassword })
      });
      
      const verifyData = await verifyRes.json();
      if (!verifyData.valid) { 
        toast.error('Contraseña incorrecta'); 
        setConfirming(false); 
        return; 
      }
      
      const endpoint = `${API}/tenants/${confirmDialog.tenant.id}`;
      let response;
      
      if (confirmDialog.type === 'delete') {
        response = await fetch(`${endpoint}/permanent`, { 
          method: 'DELETE', 
          headers: { Authorization: `Bearer ${getToken()}` } 
        });
      } else {
        response = await fetch(`${endpoint}/${confirmDialog.type}`, { 
          method: 'PATCH', 
          headers: { Authorization: `Bearer ${getToken()}` } 
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Error al procesar la acción');
        setConfirming(false);
        return;
      }
      
      toast.success(confirmDialog.type === 'delete' ? 'Negocio eliminado correctamente' : confirmDialog.type === 'activate' ? 'Negocio activado' : 'Negocio desactivado');
      setConfirmDialog({ open: false, type: 'deactivate', tenant: null });
      setConfirmPassword('');
      await fetchTenants();
    } catch (error) { 
      console.error('Error:', error);
      toast.error('Error al procesar la acción'); 
    }
    finally { setConfirming(false); }
  };

  const markAsPaid = async (tenant: Tenant) => {
    const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);
    try {
      await fetch(`${API}/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ nextPaymentDate: nextMonth.toISOString() })
      });
      toast.success('Pago registrado');
      fetchTenants();
    } catch { toast.error('Error'); }
  };

  const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString('es-AR') : '-';
  
  const getDaysRemaining = (date?: string) => {
    if (!date) return null;
    return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const businessTenants = tenants.filter(t => t.slug !== 'sistema');
  const filtered = businessTenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.whatsapp?.includes(searchTerm) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: businessTenants.length,
    active: businessTenants.filter(t => t.active).length,
    pending: businessTenants.filter(t => { const d = getDaysRemaining(t.nextPaymentDate); return d !== null && d <= 7; }).length,
    revenue: businessTenants.reduce((s, t) => s + (t.planPrice || 0), 0),
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Negocios</h1>
          <p className="text-muted-foreground text-sm">Gestión de clientes</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nuevo negocio
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <article className="rounded-md p-4 bg-white dark:bg-zinc-900 flex items-center gap-3">
          <span className="bg-blue-100 dark:bg-blue-900/30 rounded-lg h-10 w-10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-blue-500" />
          </span>
          <div>
            <p className="text-2xl font-semibold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </article>
        <article className="rounded-md p-4 bg-white dark:bg-zinc-900 flex items-center gap-3">
          <span className="bg-green-100 dark:bg-green-900/30 rounded-lg h-10 w-10 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </span>
          <div>
            <p className="text-2xl font-semibold">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Activos</p>
          </div>
        </article>
        <article className="rounded-md p-4 bg-white dark:bg-zinc-900 flex items-center gap-3">
          <span className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg h-10 w-10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          </span>
          <div>
            <p className="text-2xl font-semibold">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Por cobrar</p>
          </div>
        </article>
        <article className="rounded-md p-4 bg-white dark:bg-zinc-900 flex items-center gap-3">
          <span className="bg-purple-100 dark:bg-purple-900/30 rounded-lg h-10 w-10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </span>
          <div>
            <p className="text-2xl font-semibold">${stats.revenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Mensual</p>
          </div>
        </article>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {/* List */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {searchTerm ? 'Sin resultados' : 'No hay negocios'}
          </div>
        ) : (
          <div className="divide-y dark:divide-zinc-800">
            {filtered.map((tenant) => {
              const days = getDaysRemaining(tenant.nextPaymentDate);
              return (
                <div key={tenant.id} className={`p-4 hover:bg-muted/50 transition-colors ${!tenant.active ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{tenant.name}</h3>
                        <Badge variant="outline" className="text-xs">{tenant.locale === 'en' ? '🇺🇸 EN' : '🇦🇷 ES'}</Badge>
                        {!tenant.active && <Badge variant="outline" className="text-xs">Inactivo</Badge>}
                        {!tenant.onboardingCompleted && <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600">Sin configurar</Badge>}
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {tenant.whatsapp && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{tenant.whatsapp}</span>}
                        {tenant.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{tenant.email}</span>}
                        {tenant.instagram && <span className="flex items-center gap-1"><Instagram className="h-3 w-3" />@{tenant.instagram}</span>}
                      </div>

                      <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Alta: {formatDate(tenant.createdAt)}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{tenant._count.users} usuarios</span>
                        <span className="flex items-center gap-1"><Package className="h-3 w-3" />{tenant._count.products} productos</span>
                      </div>

                      {tenant.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic border-l-2 pl-2">
                          {tenant.notes.length > 80 ? tenant.notes.substring(0, 80) + '...' : tenant.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {tenant.planPrice ? (
                          <p className="font-semibold">${tenant.planPrice.toLocaleString()}<span className="text-xs text-muted-foreground">/mes</span></p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Sin precio</p>
                        )}
                        
                        {days !== null && (
                          <div className="mt-1">
                            {days < 0 ? (
                              <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Vencido hace {Math.abs(days)}d</Badge>
                            ) : days === 0 ? (
                              <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Vence hoy</Badge>
                            ) : days <= 7 ? (
                              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">{days} días</Badge>
                            ) : (
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">{days} días</Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedTenant({...tenant}); setEditDialogOpen(true); }}>
                            <Edit className="h-4 w-4 mr-2" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => markAsPaid(tenant)}>
                            <DollarSign className="h-4 w-4 mr-2" />Marcar como pagado
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {tenant.active ? (
                            <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, type: 'deactivate', tenant })}>
                              <PowerOff className="h-4 w-4 mr-2" />Desactivar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setConfirmDialog({ open: true, type: 'activate', tenant })}>
                              <Power className="h-4 w-4 mr-2" />Activar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600" onClick={() => setConfirmDialog({ open: true, type: 'delete', tenant })}>
                            <Trash2 className="h-4 w-4 mr-2" />Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo negocio</DialogTitle>
            <DialogDescription>Creá un nuevo cliente con su cuenta de administrador</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nombre del dueño</Label>
              <Input placeholder="Nicolas Percio" value={newTenant.adminName} onChange={(e) => setNewTenant({ ...newTenant, adminName: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" placeholder="nicodelpercio@gmail.com" value={newTenant.adminEmail} onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })} />
            </div>
            <div>
              <Label>Contraseña</Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={newTenant.adminPassword} onChange={(e) => setNewTenant({ ...newTenant, adminPassword: e.target.value })} />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label>Precio mensual ($)</Label>
              <Input type="number" placeholder="15000" value={newTenant.planPrice || ''} onChange={(e) => setNewTenant({ ...newTenant, planPrice: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Idioma del sistema</Label>
              <Select value={newTenant.locale} onValueChange={(value) => setNewTenant({ ...newTenant, locale: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">🇦🇷 Español (completo)</SelectItem>
                  <SelectItem value="en">🇺🇸 English (básico)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {newTenant.locale === 'es' ? 'CRM, WhatsApp, Turnos, Asistente IA' : 'Solo inventario y ventas'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Crear negocio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar negocio</DialogTitle>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Nombre del negocio</Label>
                <Input value={selectedTenant.name} onChange={(e) => setSelectedTenant({ ...selectedTenant, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>WhatsApp</Label>
                  <Input placeholder="1123456789" value={selectedTenant.whatsapp || ''} onChange={(e) => setSelectedTenant({ ...selectedTenant, whatsapp: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={selectedTenant.email || ''} onChange={(e) => setSelectedTenant({ ...selectedTenant, email: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Instagram (sin @)</Label>
                <Input placeholder="mi_negocio" value={selectedTenant.instagram || ''} onChange={(e) => setSelectedTenant({ ...selectedTenant, instagram: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Precio mensual ($)</Label>
                  <Input type="number" value={selectedTenant.planPrice || ''} onChange={(e) => setSelectedTenant({ ...selectedTenant, planPrice: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Próximo pago</Label>
                  <Input type="date" value={selectedTenant.nextPaymentDate?.split('T')[0] || ''} onChange={(e) => setSelectedTenant({ ...selectedTenant, nextPaymentDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
                </div>
              </div>
              <div>
                <Label>Notas internas</Label>
                <Textarea placeholder="Notas sobre este cliente..." value={selectedTenant.notes || ''} onChange={(e) => setSelectedTenant({ ...selectedTenant, notes: e.target.value })} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => { if (!open) { setConfirmDialog({ ...confirmDialog, open: false }); setConfirmPassword(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === 'delete' ? '¿Eliminar negocio?' : confirmDialog.type === 'activate' ? '¿Activar negocio?' : '¿Desactivar negocio?'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'delete' 
                ? 'Esta acción es permanente y eliminará todos los datos del negocio.'
                : confirmDialog.type === 'activate'
                ? 'El negocio podrá acceder al sistema nuevamente.'
                : 'El negocio no podrá acceder al sistema hasta que lo reactives.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Ingresá tu contraseña para confirmar</Label>
            <Input type="password" placeholder="Tu contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmDialog({ ...confirmDialog, open: false }); setConfirmPassword(''); }}>Cancelar</Button>
            <Button variant={confirmDialog.type === 'delete' ? 'destructive' : 'default'} onClick={handleConfirm} disabled={confirming || !confirmPassword}>
              {confirming && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {confirmDialog.type === 'delete' ? 'Eliminar' : confirmDialog.type === 'activate' ? 'Activar' : 'Desactivar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
