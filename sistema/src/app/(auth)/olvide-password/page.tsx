'use client';

import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Mail, CheckCircle, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sistema-gestion-production-d961.up.railway.app/api';

// Cooldowns progresivos en segundos: 0, 60, 300, 600 (0, 1min, 5min, 10min)
const COOLDOWNS = [0, 60, 300, 600];

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Cargar intentos guardados
  useEffect(() => {
    const saved = localStorage.getItem('resetPasswordAttempts');
    if (saved) {
      const { count, cooldownUntil } = JSON.parse(saved);
      setAttempts(count);
      if (cooldownUntil && cooldownUntil > Date.now()) {
        setCooldownEnd(cooldownUntil);
      }
    }
  }, []);

  // Timer del cooldown
  useEffect(() => {
    if (!cooldownEnd) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.ceil((cooldownEnd - Date.now()) / 1000);
      if (remaining <= 0) {
        setCooldownEnd(null);
        setTimeLeft(0);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownEnd]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setError('Ingresá un email válido');
      return;
    }

    if (cooldownEnd && cooldownEnd > Date.now()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/payments/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }
      
      // Éxito - mostrar mensaje y configurar cooldown
      setSent(true);
      
      // Incrementar intentos y guardar
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      // Calcular próximo cooldown
      const cooldownIndex = Math.min(newAttempts, COOLDOWNS.length - 1);
      const cooldownSeconds = COOLDOWNS[cooldownIndex];
      
      if (cooldownSeconds > 0) {
        const newCooldownEnd = Date.now() + (cooldownSeconds * 1000);
        setCooldownEnd(newCooldownEnd);
        localStorage.setItem('resetPasswordAttempts', JSON.stringify({
          count: newAttempts,
          cooldownUntil: newCooldownEnd
        }));
      } else {
        localStorage.setItem('resetPasswordAttempts', JSON.stringify({
          count: newAttempts,
          cooldownUntil: null
        }));
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error de conexión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (cooldownEnd && cooldownEnd > Date.now()) {
      return;
    }
    setSent(false);
  };

  const isOnCooldown = cooldownEnd && cooldownEnd > Date.now();

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

            {sent ? (
              <>
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
                  ¡Revisá tu email!
                </h1>
                <p className="text-gray-600 dark:text-zinc-400 text-sm">
                  Te enviamos un link para restablecer tu contraseña a <strong>{email}</strong>
                </p>
                <p className="text-gray-500 dark:text-zinc-500 text-xs mt-2">
                  Si no lo ves, revisá la carpeta de spam
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
                  ¿Olvidaste tu contraseña?
                </h1>
                <p className="text-gray-600 dark:text-zinc-400 text-sm">
                  Ingresá tu email y te enviaremos un link para restablecerla
                </p>
              </>
            )}
          </div>

          {!sent && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 border border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 rounded-lg focus:outline-none focus:border-gray-900 dark:focus:border-zinc-500"
                    placeholder="tu@email.com"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !!isOnCooldown}
                className="w-full h-11 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : isOnCooldown ? (
                  <>
                    <Clock className="w-5 h-5" />
                    <span>Esperá {formatTime(timeLeft)}</span>
                  </>
                ) : (
                  'Enviar link de recuperación'
                )}
              </button>
            </form>
          )}

          {sent && (
            <button
              onClick={handleResend}
              disabled={!!isOnCooldown}
              className="w-full h-11 border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 rounded-lg font-medium transition-all hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isOnCooldown ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Podés reenviar en {formatTime(timeLeft)}</span>
                </>
              ) : (
                'Enviar a otro email'
              )}
            </button>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/iniciar-sesion"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
