'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sistema-gestion-production-d961.up.railway.app/api';

export default function CompletarRegistroPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [tenantData, setTenantData] = useState<any>(null);

  const [formData, setFormData] = useState({
    ownerName: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cargar datos del tenant
  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        const res = await fetch(`${API_URL}/payments/tenant-info/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Token inválido o expirado');
          setLoading(false);
          return;
        }

        setTenantData(data);
        setEmail(data.email);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los datos');
        setLoading(false);
      }
    };

    if (token) {
      fetchTenantData();
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.ownerName.trim()) {
      setError('Ingresá tu nombre completo');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/payments/complete-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          ownerName: formData.ownerName.trim(),
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al completar el registro');
        setSubmitting(false);
        return;
      }

      // Mostrar éxito
      toast.success('¡Registro completado! Ya podés iniciar sesión.');

      // Registro completado - redirigir a login
      setTimeout(() => {
        router.push('/iniciar-sesion?registered=true');
      }, 1500);

    } catch (err) {
      setError('Error de conexión. Intentá de nuevo.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-zinc-400">Cargando...</p>
        </div>
      </section>
    );
  }

  if (error && !tenantData) {
    return (
      <section className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950">
        <div className="text-center max-w-md mx-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
            Error
          </h2>
          <p className="text-gray-600 dark:text-zinc-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg hover:bg-gray-800 dark:hover:bg-zinc-200 transition"
          >
            Volver al inicio
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950 py-12">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-zinc-700 rounded-2xl mb-4">
              <Image
                src="/images/logo-icon.png"
                width={40}
                height={40}
                alt="Clodeb"
              />
            </div>

            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
              ¡Email verificado!
            </h1>
            <p className="text-gray-600 dark:text-zinc-400 text-sm">
              Completá tu registro para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email (bloqueado) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full h-11 px-4 bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-gray-500 dark:text-zinc-400 cursor-not-allowed"
              />
            </div>

            {/* Nombre completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Nombre completo
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="Nicolas Percio"
                required
                className="w-full h-11 px-4 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 dark:text-zinc-100 transition"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full h-11 px-4 pr-11 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 dark:text-zinc-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Repetí tu contraseña"
                  required
                  className="w-full h-11 px-4 pr-11 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 dark:text-zinc-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3">
                <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Completando registro...</span>
                </>
              ) : (
                'Completar registro'
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">
              Después de completar tu registro, podrás configurar tu negocio.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
