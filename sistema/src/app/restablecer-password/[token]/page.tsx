'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, CheckCircle, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sistema-gestion-production-d961.up.railway.app/api';

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/payments/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setSuccess(true);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push('/iniciar-sesion');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950">
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

            {success ? (
              <>
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
                  ¡Contraseña actualizada!
                </h1>
                <p className="text-gray-600 dark:text-zinc-400 text-sm">
                  Redirigiendo al inicio de sesión...
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
                  Nueva contraseña
                </h1>
                <p className="text-gray-600 dark:text-zinc-400 text-sm">
                  Ingresá tu nueva contraseña
                </p>
              </>
            )}
          </div>

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-10 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-gray-900 dark:focus:border-zinc-500"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-gray-900 dark:focus:border-zinc-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Guardar nueva contraseña'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/iniciar-sesion"
              className="text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 transition"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
