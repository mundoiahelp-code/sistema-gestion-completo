'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Settings,
  Users,
  Mail,
  DollarSign,
  Shield,
  Activity,
  Wrench,
  Save,
  Send,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

const API = process.env.NEXT_PUBLIC_API_URL;

interface PlanLimits {
  trial: { users: number; stores: number; products: number };
  basic: { users: number; stores: number; products: number };
  pro: { users: number; stores: number; products: number };
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  tenantId: string;
  tenantName: string;
  action: string;
  details: string;
  createdAt: string;
}

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('planes');

  // Configuración de Planes
  const [trialDuration, setTrialDuration] = useState(14);
  const [planLimits, setPlanLimits] = useState<PlanLimits>({
    trial: { users: 2, stores: 2, products: 50 },
    basic: { users: 5, stores: 5, products: 200 },
    pro: { users: 15, stores: 10, products: 1000 },
  });

  // Templates de Email
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);

  // Email Masivo
  const [massEmailSubject, setMassEmailSubject] = useState('');
  const [massEmailBody, setMassEmailBody] = useState('');
  const [sendingMassEmail, setSendingMassEmail] = useState(false);

  // Recordatorios de Pago
  const [paymentReminders, setPaymentReminders] = useState({
    enabled: true,
    daysBeforeExpiry: [7, 3, 1],
    afterExpiryDays: [1, 3, 7],
  });

  // Usuarios Admin
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  // Logs de Actividad
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [logsFilter, setLogsFilter] = useState('');

  // 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Pagos y Facturación
  const [paymentConfig, setPaymentConfig] = useState({
    currency: 'USD',
    taxRate: 0,
    invoicePrefix: 'INV',
    autoInvoice: true,
  });

  // Mantenimiento
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  const getToken = () => Cookies.get('token');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch(`${API}/system/config`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Cargar configuraciones
        if (data.trialDuration) setTrialDuration(data.trialDuration);
        if (data.planLimits) {
          // Convertir los límites del formato de DB al formato del frontend
          const limits = data.planLimits;
          setPlanLimits({
            trial: {
              users: limits.trial?.users || 2,
              stores: limits.trial?.stores || 2,
              products: limits.trial?.products || 50,
            },
            basic: {
              users: limits.basic?.users || 8,
              stores: limits.basic?.stores || 5,
              products: limits.basic?.products || 200,
            },
            pro: {
              users: limits.pro?.users || 18,
              stores: limits.pro?.stores || 10,
              products: limits.pro?.products || 1000,
            },
          });
        }
        if (data.emailTemplates) setEmailTemplates(data.emailTemplates);
        if (data.paymentReminders) setPaymentReminders(data.paymentReminders);
        if (data.twoFactorEnabled) setTwoFactorEnabled(data.twoFactorEnabled);
        if (data.paymentConfig) setPaymentConfig(data.paymentConfig);
        if (data.maintenanceMode) setMaintenanceMode(data.maintenanceMode);
        if (data.maintenanceMessage) setMaintenanceMessage(data.maintenanceMessage);
      }
    } catch (err) {
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (section: string, data: any) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/system/config/${section}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success('Configuración guardada');
      } else {
        toast.error('Error al guardar');
      }
    } catch (err) {
      console.error('Error saving config:', err);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const sendMassEmail = async () => {
    if (!massEmailSubject || !massEmailBody) {
      toast.error('Completá el asunto y el mensaje');
      return;
    }

    setSendingMassEmail(true);
    try {
      const res = await fetch(`${API}/system/mass-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          subject: massEmailSubject,
          body: massEmailBody,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Email enviado a ${data.sent} usuarios`);
        setMassEmailSubject('');
        setMassEmailBody('');
      } else {
        toast.error('Error al enviar emails');
      }
    } catch (err) {
      console.error('Error sending mass email:', err);
      toast.error('Error al enviar emails');
    } finally {
      setSendingMassEmail(false);
    }
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
      <div>
        <h1 className="text-2xl font-bold">Configuración del Sistema</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Administrá todos los aspectos del sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="planes" className="gap-2">
            <Settings className="h-4 w-4" />
            Planes
          </TabsTrigger>
          <TabsTrigger value="emails" className="gap-2">
            <Mail className="h-4 w-4" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Activity className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="mantenimiento" className="gap-2">
            <Wrench className="h-4 w-4" />
            Mantenimiento
          </TabsTrigger>
        </TabsList>

        {/* TAB: Planes y Límites */}
        <TabsContent value="planes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Duración del Trial</CardTitle>
              <CardDescription>
                Configurá cuántos días dura el período de prueba gratuito
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={trialDuration}
                  onChange={(e) => setTrialDuration(parseInt(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm text-zinc-500">días</span>
                <Button
                  onClick={() => saveConfig('trial-duration', { trialDuration })}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Límites por Plan</CardTitle>
              <CardDescription>
                Configurá los límites de usuarios, sucursales y productos por plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(planLimits).map(([plan, limits]) => (
                  <div key={plan} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-4 capitalize">{plan}</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Usuarios</Label>
                        <Input
                          type="number"
                          value={limits.users}
                          onChange={(e) =>
                            setPlanLimits({
                              ...planLimits,
                              [plan]: { ...limits, users: parseInt(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Sucursales</Label>
                        <Input
                          type="number"
                          value={limits.stores}
                          onChange={(e) =>
                            setPlanLimits({
                              ...planLimits,
                              [plan]: { ...limits, stores: parseInt(e.target.value) },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Productos</Label>
                        <Input
                          type="number"
                          value={limits.products}
                          onChange={(e) =>
                            setPlanLimits({
                              ...planLimits,
                              [plan]: { ...limits, products: parseInt(e.target.value) },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() => saveConfig('plan-limits', { planLimits })}
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Límites
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recordatorios de Pago</CardTitle>
              <CardDescription>
                Configurá cuándo enviar recordatorios automáticos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Activar recordatorios automáticos</Label>
                <Switch
                  checked={paymentReminders.enabled}
                  onCheckedChange={(checked) =>
                    setPaymentReminders({ ...paymentReminders, enabled: checked })
                  }
                />
              </div>
              <div>
                <Label className="text-sm">Días antes del vencimiento</Label>
                <p className="text-xs text-zinc-500 mb-2">
                  Se enviarán recordatorios estos días antes de que expire el plan
                </p>
                <div className="flex gap-2">
                  {[7, 5, 3, 1].map((days) => (
                    <Button
                      key={days}
                      variant={paymentReminders.daysBeforeExpiry.includes(days) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newDays = paymentReminders.daysBeforeExpiry.includes(days)
                          ? paymentReminders.daysBeforeExpiry.filter((d) => d !== days)
                          : [...paymentReminders.daysBeforeExpiry, days].sort((a, b) => b - a);
                        setPaymentReminders({ ...paymentReminders, daysBeforeExpiry: newDays });
                      }}
                    >
                      {days}d
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm">Días después del vencimiento</Label>
                <p className="text-xs text-zinc-500 mb-2">
                  Se enviarán recordatorios estos días después de que expire
                </p>
                <div className="flex gap-2">
                  {[1, 3, 7, 14].map((days) => (
                    <Button
                      key={days}
                      variant={paymentReminders.afterExpiryDays.includes(days) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newDays = paymentReminders.afterExpiryDays.includes(days)
                          ? paymentReminders.afterExpiryDays.filter((d) => d !== days)
                          : [...paymentReminders.afterExpiryDays, days].sort((a, b) => a - b);
                        setPaymentReminders({ ...paymentReminders, afterExpiryDays: newDays });
                      }}
                    >
                      {days}d
                    </Button>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => saveConfig('payment-reminders', { paymentReminders })}
                disabled={saving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar Recordatorios
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Emails */}
        <TabsContent value="emails" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Masivo</CardTitle>
              <CardDescription>
                Enviá un email personalizado a todos los usuarios registrados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Asunto</Label>
                <Input
                  value={massEmailSubject}
                  onChange={(e) => setMassEmailSubject(e.target.value)}
                  placeholder="Ej: Nuevas funcionalidades disponibles"
                />
              </div>
              <div>
                <Label>Mensaje</Label>
                <Textarea
                  value={massEmailBody}
                  onChange={(e) => setMassEmailBody(e.target.value)}
                  placeholder="Escribe tu mensaje aquí..."
                  rows={8}
                />
              </div>
              <Button
                onClick={sendMassEmail}
                disabled={sendingMassEmail}
                className="w-full"
              >
                {sendingMassEmail ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar a Todos
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Templates de Email</CardTitle>
              <CardDescription>
                Personalizá los emails automáticos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500">Próximamente: Editor de templates</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Actividad</CardTitle>
              <CardDescription>
                Monitoreá qué está pasando en cada negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Buscar por negocio..."
                  value={logsFilter}
                  onChange={(e) => setLogsFilter(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API}/system/activity-logs?limit=100`, {
                        headers: { Authorization: `Bearer ${getToken()}` },
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setActivityLogs(data);
                      }
                    } catch (err) {
                      console.error('Error loading logs:', err);
                      toast.error('Error al cargar logs');
                    }
                  }}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Cargar Logs
                </Button>
              </div>

              {activityLogs.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Negocio</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Acción</TableHead>
                        <TableHead>Detalles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activityLogs
                        .filter((log) =>
                          logsFilter
                            ? log.tenant?.name?.toLowerCase().includes(logsFilter.toLowerCase())
                            : true
                        )
                        .map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs">
                              {new Date(log.createdAt).toLocaleString('es-AR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </TableCell>
                            <TableCell className="font-medium">
                              {log.tenant?.name || 'N/A'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.user?.name || 'Sistema'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.action}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-zinc-500 max-w-xs truncate">
                              {log.details || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>No hay logs para mostrar</p>
                  <p className="text-sm">Hacé clic en "Cargar Logs" para ver la actividad</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Mantenimiento */}
        <TabsContent value="mantenimiento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modo Mantenimiento</CardTitle>
              <CardDescription>
                Pausá el acceso al sistema temporalmente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <div>
                  <p className="font-medium">Activar Modo Mantenimiento</p>
                  <p className="text-sm text-zinc-500">
                    Los usuarios no podrán acceder al sistema
                  </p>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={(checked) => {
                    setMaintenanceMode(checked);
                    saveConfig('maintenance', { enabled: checked, message: maintenanceMessage });
                  }}
                />
              </div>
              <div>
                <Label>Mensaje de Mantenimiento</Label>
                <Textarea
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  placeholder="Estamos realizando mejoras. Volvemos pronto..."
                  rows={4}
                />
              </div>
              <Button
                onClick={() =>
                  saveConfig('maintenance', { enabled: maintenanceMode, message: maintenanceMessage })
                }
                disabled={saving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
