'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Building2, CheckCircle } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';
console.log('🔍 API URL configurada:', API);
console.log('🔍 Variable de entorno:', process.env.NEXT_PUBLIC_API_URL);

interface TenantInfo {
  id: string;
  name: string;
  locale: string;
  planPrice?: number;
}

export default function ActivarCuentaPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      console.log('API URL:', API);
      console.log('Full URL:', `${API}/tenants/validate-invitation/${token}`);
      const res = await fetch(`${API}/tenants/validate-invitation/${token}`);
      console.log('Response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        setTenant(data.tenant);
        
        // Si el tenant ya tiene un usuario admin, redirigir a login
        if (data.hasAdmin) {
          toast.info('Esta cuenta ya fue activada');
          setTimeout(() => router.push('/iniciar-sesion'), 1500);
          return;
        }
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'El link de invitación no es válido o ya fue utilizado.');
      }
    } catch (err) {
      console.error('Error validating token:', err);
      setError('Error al validar el link.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      console.log('Submitting activation with API:', API);
      console.log('Full URL:', `${API}/tenants/activate`);
      const res = await fetch(`${API}/tenants/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });
      console.log('Activation response status:', res.status);

      if (res.ok) {
        setSuccess(true);
        toast.success('¡Cuenta activada! Redirigiendo...');
        setTimeout(() => {
          router.push('/iniciar-sesion');
        }, 2000);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al activar la cuenta');
      }
    } catch {
      toast.error('Error al activar la cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  const isEnglish = tenant?.locale === 'en';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Link inválido</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push('/iniciar-sesion')}>
            Ir al inicio de sesión
          </Button>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-xl font-semibold mb-2">
            {isEnglish ? 'Account Activated!' : '¡Cuenta Activada!'}
          </h1>
          <p className="text-muted-foreground">
            {isEnglish ? 'Redirecting to login...' : 'Redirigiendo al inicio de sesión...'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950 p-4">
      <div className="w-full max-w-md">
        <Card className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-zinc-700 rounded-2xl mb-4">
              <Image
                src="/images/logo-icon.png"
                width={40}
                height={40}
                alt="Clodeb"
              />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {isEnglish ? 'Activate Your Account' : 'Activá tu Cuenta'}
            </h1>
            <p className="text-muted-foreground">
              {isEnglish 
                ? `Welcome! Set up your credentials to access your business`
                : `¡Bienvenido! Configurá tus credenciales para acceder a tu negocio`}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>{isEnglish ? 'Your Name' : 'Tu Nombre'}</Label>
              <Input
                placeholder={isEnglish ? 'John Doe' : 'Nicolas Percio'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>{isEnglish ? 'Password' : 'Contraseña'}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
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
            </div>

            <div>
              <Label>{isEnglish ? 'Confirm Password' : 'Confirmar Contraseña'}</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEnglish ? 'Activate Account' : 'Activar Cuenta'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
