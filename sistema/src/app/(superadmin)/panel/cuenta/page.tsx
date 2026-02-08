'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Mail, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CuentaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Datos del usuario
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  // Cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const getToken = () => Cookies.get('token');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        setEmail(parsed.email || '');
        setName(parsed.name || '');
      }

      // Cargar configuración de 2FA
      const res = await fetch(`${API}/system/config`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.twoFactorEnabled !== undefined) {
          setTwoFactorEnabled(data.twoFactorEnabled);
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!name || !email) {
      toast.error('Completá todos los campos');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/auth/update-profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name, email }),
      });

      if (res.ok) {
        const data = await res.json();
        // Actualizar localStorage
        const user = localStorage.getItem('user');
        if (user) {
          const parsed = JSON.parse(user);
          parsed.name = name;
          parsed.email = email;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
        toast.success('Perfil actualizado');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al actualizar perfil');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Completá todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        toast.success('Contraseña actualizada');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al cambiar contraseña');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error('Error al cambiar contraseña');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/system/config/2fa`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ enabled }),
      });

      if (res.ok) {
        setTwoFactorEnabled(enabled);
        toast.success(enabled ? '2FA activado' : '2FA desactivado');
      } else {
        toast.error('Error al actualizar 2FA');
      }
    } catch (err) {
      console.error('Error toggling 2FA:', err);
      toast.error('Error al actualizar 2FA');
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Cuenta</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Gestioná tu información personal y seguridad
        </p>
      </div>

      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Información Personal
          </CardTitle>
          <CardDescription>
            Tu información de cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre completo"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              type="email"
            />
          </div>
          <Button
            onClick={handleUpdateProfile}
            disabled={saving}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </Button>
        </CardContent>
      </Card>

      {/* Cambiar Contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>
            Actualizá tu contraseña de acceso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Contraseña Actual</Label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresá tu contraseña actual"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>Nueva Contraseña</Label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label>Confirmar Nueva Contraseña</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetí la nueva contraseña"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={saving}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Cambiar Contraseña
          </Button>
        </CardContent>
      </Card>

      {/* Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Seguridad
          </CardTitle>
          <CardDescription>
            Configurá opciones de seguridad adicionales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Autenticación de Dos Factores (2FA)</p>
              <p className="text-sm text-zinc-500">
                Agregá una capa extra de seguridad a tu cuenta
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleToggle2FA}
              disabled={saving}
            />
          </div>
          {twoFactorEnabled && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ 2FA está activado. Se te pedirá un código de verificación al iniciar sesión.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
