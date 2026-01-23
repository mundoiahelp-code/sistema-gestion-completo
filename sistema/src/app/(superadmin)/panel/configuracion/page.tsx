'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import {
  Mail, Server, Save, Loader2, Eye, EyeOff, Send, CheckCircle, XCircle,
  Building2, Globe, Palette
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Sistema
  const [systemConfig, setSystemConfig] = useState({
    systemName: 'MundoIAple',
    systemUrl: '',
    supportEmail: 'sistema@mundoiaple.com',
  });

  // SMTP
  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.hostinger.com',
    port: '465',
    secure: true,
    user: 'sistema@mundoiaple.com',
    pass: '',
    from: 'MundoIAple Sistema <sistema@mundoiaple.com>',
  });

  // Email Templates
  const [emailTemplates, setEmailTemplates] = useState({
    welcomeSubjectEs: 'Bienvenido a {systemName} - ¡Tu cuenta está lista!',
    welcomeSubjectEn: 'Welcome to {systemName} - Your account is ready!',
    welcomeBodyEs: `¡Hola {adminName}!

Tu negocio {businessName} ha sido creado exitosamente.

Tus credenciales de acceso:
Email: {adminEmail}
Contraseña: {adminPassword}

Accedé al sistema en: {systemUrl}

Te recomendamos cambiar tu contraseña después del primer inicio de sesión.

Saludos,
El equipo de {systemName}`,
    welcomeBodyEn: `Hello {adminName}!

Your business {businessName} has been created successfully.

Your access credentials:
Email: {adminEmail}
Password: {adminPassword}

Access the system at: {systemUrl}

We recommend changing your password after your first login.

Best regards,
The {systemName} team`,
  });

  const getToken = () => Cookies.get('accessToken') || Cookies.get('token');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch(`${API}/system/config`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.system) setSystemConfig(data.system);
        if (data.smtp) setSmtpConfig({ ...smtpConfig, ...data.smtp, pass: '' }); // No cargar password
        if (data.emailTemplates) setEmailTemplates(data.emailTemplates);
      }
    } catch (err) {
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystem = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/system/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ system: systemConfig })
      });
      if (res.ok) {
        toast.success('Configuración guardada');
      } else {
        toast.error('Error al guardar');
      }
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSmtp = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/system/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ smtp: smtpConfig })
      });
      if (res.ok) {
        toast.success('Configuración SMTP guardada');
      } else {
        toast.error('Error al guardar');
      }
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    try {
      const res = await fetch(`${API}/system/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ to: systemConfig.supportEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Email de prueba enviado correctamente');
      } else {
        toast.error(data.error || 'Error al enviar email de prueba');
      }
    } catch {
      toast.error('Error al enviar email de prueba');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveTemplates = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/system/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ emailTemplates })
      });
      if (res.ok) {
        toast.success('Templates guardados');
      } else {
        toast.error('Error al guardar');
      }
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuración del Sistema</h1>
        <p className="text-muted-foreground">Configurá los parámetros generales y emails</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="smtp" className="gap-2">
            <Server className="h-4 w-4" />
            Email SMTP
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Información del Sistema</h2>
            <div className="space-y-4 max-w-xl">
              <div>
                <Label>Nombre del Sistema</Label>
                <Input
                  value={systemConfig.systemName}
                  onChange={(e) => setSystemConfig({ ...systemConfig, systemName: e.target.value })}
                  placeholder="MundoIAple"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Se usa en emails y títulos
                </p>
              </div>
              <div>
                <Label>URL del Sistema (producción)</Label>
                <Input
                  value={systemConfig.systemUrl}
                  onChange={(e) => setSystemConfig({ ...systemConfig, systemUrl: e.target.value })}
                  placeholder="https://app.mundoiaple.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Link que se envía en los emails de bienvenida
                </p>
              </div>
              <div>
                <Label>Email de Soporte</Label>
                <Input
                  type="email"
                  value={systemConfig.supportEmail}
                  onChange={(e) => setSystemConfig({ ...systemConfig, supportEmail: e.target.value })}
                  placeholder="soporte@mundoiaple.com"
                />
              </div>
              <Button onClick={handleSaveSystem} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* SMTP */}
        <TabsContent value="smtp">
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-4">Configuración SMTP</h2>
            <div className="space-y-4 max-w-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Host SMTP</Label>
                  <Input
                    value={smtpConfig.host}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                    placeholder="smtp.hostinger.com"
                  />
                </div>
                <div>
                  <Label>Puerto</Label>
                  <Input
                    value={smtpConfig.port}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                    placeholder="465"
                  />
                </div>
              </div>
              <div>
                <Label>Usuario (email)</Label>
                <Input
                  value={smtpConfig.user}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                  placeholder="sistema@mundoiaple.com"
                />
              </div>
              <div>
                <Label>Contraseña</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={smtpConfig.pass}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, pass: e.target.value })}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Dejá vacío para mantener la contraseña actual
                </p>
              </div>
              <div>
                <Label>Remitente (From)</Label>
                <Input
                  value={smtpConfig.from}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, from: e.target.value })}
                  placeholder="MundoIAple <sistema@mundoiaple.com>"
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSaveSmtp} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Guardar
                </Button>
                <Button variant="outline" onClick={handleTestEmail} disabled={testing}>
                  {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Enviar email de prueba
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates">
          <Card className="p-6">
            <h2 className="text-lg font-medium mb-2">Templates de Email</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Variables disponibles: {'{systemName}'}, {'{businessName}'}, {'{adminName}'}, {'{adminEmail}'}, {'{adminPassword}'}, {'{systemUrl}'}
            </p>
            
            <div className="space-y-6">
              {/* Español */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  🇦🇷 Email de Bienvenida (Español)
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label>Asunto</Label>
                    <Input
                      value={emailTemplates.welcomeSubjectEs}
                      onChange={(e) => setEmailTemplates({ ...emailTemplates, welcomeSubjectEs: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Contenido</Label>
                    <Textarea
                      value={emailTemplates.welcomeBodyEs}
                      onChange={(e) => setEmailTemplates({ ...emailTemplates, welcomeBodyEs: e.target.value })}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Inglés */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  🇺🇸 Welcome Email (English)
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label>Subject</Label>
                    <Input
                      value={emailTemplates.welcomeSubjectEn}
                      onChange={(e) => setEmailTemplates({ ...emailTemplates, welcomeSubjectEn: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Content</Label>
                    <Textarea
                      value={emailTemplates.welcomeBodyEn}
                      onChange={(e) => setEmailTemplates({ ...emailTemplates, welcomeBodyEn: e.target.value })}
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveTemplates} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Guardar Templates
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
