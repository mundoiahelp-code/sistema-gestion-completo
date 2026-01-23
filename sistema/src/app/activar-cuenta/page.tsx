'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, CheckCircle, Mail, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

function ActivarCuentaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState(1); // Paso 1: contraseña, Paso 2: código
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: searchParams.get('name') || '',
    email: searchParams.get('email') || '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
  });

  const handleContinue = async () => {
    // Validaciones
    if (!formData.name.trim()) {
      toast.error('Ingresá tu nombre completo');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Ingresá tu email');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    // AQUÍ se envía el email
    setSendingCode(true);
    try {
      const res = await fetch(`${API_URL}/payments/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ownerName: formData.name, 
          email: formData.email, 
          locale: 'es' 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar código');
      }

      toast.success('¡Código enviado! Revisá tu email.');
      setStep(2); // Pasar al paso 2
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar código');
    } finally {
      setSendingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (!formData.email) {
      toast.error('Ingresá tu email');
      return;
    }

    setResending(true);
    try {
      const res = await fetch(`${API_URL}/payments/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ownerName: formData.name, 
          email: formData.email, 
          locale: 'es' 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al reenviar código');
      }

      toast.success('Código reenviado. Revisá tu email.');
    } catch (error: any) {
      toast.error(error.message || 'Error al reenviar código');
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.verificationCode.trim() || formData.verificationCode.length !== 6) {
      toast.error('Ingresá el código de 6 dígitos');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/payments/activate-with-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerName: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          verificationCode: formData.verificationCode.trim(),
          locale: 'es',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al activar cuenta');
      }

      toast.success('¡Cuenta activada! Redirigiendo...');
      
      setTimeout(() => {
        router.push('/iniciar-sesion?registered=true');
      }, 1500);

    } catch (error: any) {
      toast.error(error.message || 'Error al activar cuenta');
      setSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950 py-12">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 md:p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            {/* Iconos lado a lado */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-zinc-700 rounded-2xl">
                <Image
                  src="/images/logo_apple_black.png"
                  width={40}
                  height={40}
                  alt="Logo"
                  className="block dark:hidden"
                />
                <Image
                  src="/images/logo_apple.png"
                  width={40}
                  height={40}
                  alt="Logo"
                  className="hidden dark:block"
                />
              </div>

              {step === 1 ? (
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-blue-500" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-green-500" />
                </div>
              )}
            </div>

            {step === 1 ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
                  Activá tu Cuenta
                </h1>
                <p className="text-gray-600 dark:text-zinc-400 text-sm">
                  Configurá tu contraseña para continuar
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
                  Verificá tu Email
                </h1>
                <p className="text-gray-600 dark:text-zinc-400 text-sm">
                  Te enviamos un código de 6 dígitos a <strong>{formData.email}</strong>
                </p>
              </>
            )}
          </div>

          {step === 1 ? (
            // PASO 1: Contraseña
            <div className="space-y-5">
              {/* Nombre completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nicolas Percio"
                  required
                  className="w-full h-11 px-4 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 dark:text-zinc-100 transition"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@email.com"
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

              <button
                onClick={handleContinue}
                disabled={sendingCode}
                className="w-full h-11 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingCode ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Enviando código...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            // PASO 2: Código de verificación
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Código de verificación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Código de verificación
                </label>
                <input
                  type="text"
                  value={formData.verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setFormData({ ...formData, verificationCode: value });
                  }}
                  placeholder="123456"
                  required
                  maxLength={6}
                  className="w-full h-11 px-4 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 dark:text-zinc-100 transition text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 text-center">
                  Revisá tu email (incluyendo spam)
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Activando cuenta...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Activar Cuenta</span>
                  </>
                )}
              </button>

              {/* Reenviar código */}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                className="w-full text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 transition flex items-center justify-center gap-2"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Reenviando...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>¿No te llegó? Reenviar código</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">
              {step === 1 
                ? 'Al continuar, te enviaremos un código de verificación a tu email.'
                : 'El código expira en 15 minutos. Si no lo recibís, revisá tu carpeta de spam.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ActivarCuentaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    }>
      <ActivarCuentaContent />
    </Suspense>
  );
}
