'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, CheckCircle, Mail, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api';

function ActivarCuentaContent() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [step, setStep] = useState(1); // Paso 1: contraseña, Paso 2: código
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tokenError, setTokenError] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
    locale: 'es'
  });

  const isEnglish = formData.locale === 'en';

  // Cargar datos del token al montar
  useEffect(() => {
    const fetchActivationData = async () => {
      try {
        const res = await fetch(`${API_URL}/payments/activation-data/${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Token inválido');
        }

        setFormData(prev => ({
          ...prev,
          name: data.name,
          email: data.email,
          locale: data.locale || 'es'
        }));
        setLoading(false);
      } catch (error: any) {
        toast.error(error.message || 'Token inválido o expirado');
        setTokenError(true);
        setLoading(false);
      }
    };

    if (token) {
      fetchActivationData();
    }
  }, [token]);

  const handleContinue = async () => {
    // Validaciones
    if (!formData.name.trim()) {
      toast.error(isEnglish ? 'Enter your full name' : 'Ingresá tu nombre completo');
      return;
    }

    if (!formData.email.trim()) {
      toast.error(isEnglish ? 'Enter your email' : 'Ingresá tu email');
      return;
    }

    if (formData.password.length < 6) {
      toast.error(isEnglish ? 'Password must be at least 6 characters' : 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(isEnglish ? 'Passwords do not match' : 'Las contraseñas no coinciden');
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
          locale: formData.locale 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isEnglish ? 'Error sending code' : 'Error al enviar código'));
      }

      toast.success(isEnglish ? 'Code sent! Check your email.' : '¡Código enviado! Revisá tu email.');
      setStep(2); // Pasar al paso 2
    } catch (error: any) {
      toast.error(error.message || (isEnglish ? 'Error sending code' : 'Error al enviar código'));
    } finally {
      setSendingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (!formData.email) {
      toast.error(isEnglish ? 'Enter your email' : 'Ingresá tu email');
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
          locale: formData.locale 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isEnglish ? 'Error resending code' : 'Error al reenviar código'));
      }

      toast.success(isEnglish ? 'Code resent. Check your email.' : 'Código reenviado. Revisá tu email.');
    } catch (error: any) {
      toast.error(error.message || (isEnglish ? 'Error resending code' : 'Error al reenviar código'));
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.verificationCode.trim() || formData.verificationCode.length !== 6) {
      toast.error(isEnglish ? 'Enter the 6-digit code' : 'Ingresá el código de 6 dígitos');
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
          locale: formData.locale,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isEnglish ? 'Error activating account' : 'Error al activar cuenta'));
      }

      toast.success(isEnglish ? 'Account activated! Redirecting...' : '¡Cuenta activada! Redirigiendo...');
      
      // Guardar el locale en localStorage antes de redirigir
      localStorage.setItem('app_locale', formData.locale);
      
      setTimeout(() => {
        router.push(`/iniciar-sesion?registered=true&locale=${formData.locale}`);
      }, 1500);

    } catch (error: any) {
      toast.error(error.message || (isEnglish ? 'Error activating account' : 'Error al activar cuenta'));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-zinc-400">Cargando...</p>
        </div>
      </section>
    );
  }

  if (tokenError) {
    return (
      <section className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950">
        <div className="text-center max-w-md mx-4">
          <div className="bg-red-100 dark:bg-red-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
            Token Inválido
          </h1>
          <p className="text-gray-600 dark:text-zinc-400 mb-6">
            El enlace de activación es inválido o ha expirado. Por favor, solicita uno nuevo.
          </p>
          <button
            onClick={() => window.location.href = 'https://clodeb.store'}
            className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-zinc-200 transition"
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
            {/* Iconos lado a lado */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-zinc-700 rounded-2xl">
                <Image
                  src="/images/logo-icon.png"
                  width={40}
                  height={40}
                  alt="Clodeb"
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
                  {isEnglish ? 'Activate Your Account' : 'Activá tu Cuenta'}
                </h1>
                <p className="text-gray-600 dark:text-zinc-400 text-sm">
                  {isEnglish ? 'Set up your password to continue' : 'Configurá tu contraseña para continuar'}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
                  {isEnglish ? 'Verify Your Email' : 'Verificá tu Email'}
                </h1>
                <p className="text-gray-600 dark:text-zinc-400 text-sm">
                  {isEnglish 
                    ? <>We sent a 6-digit code to <strong>{formData.email}</strong></>
                    : <>Te enviamos un código de 6 dígitos a <strong>{formData.email}</strong></>
                  }
                </p>
              </>
            )}
          </div>

          {step === 1 ? (
            // PASO 1: Contraseña
            <div className="space-y-5">
              {/* Nombre completo (readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  {isEnglish ? 'Full Name' : 'Nombre completo'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  readOnly
                  className="w-full h-11 px-4 bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg dark:text-zinc-100 cursor-not-allowed"
                />
              </div>

              {/* Email (readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full h-11 px-4 bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg dark:text-zinc-100 cursor-not-allowed"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  {isEnglish ? 'Password' : 'Contraseña'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={isEnglish ? 'Minimum 6 characters' : 'Mínimo 6 caracteres'}
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
                  {isEnglish ? 'Confirm Password' : 'Confirmar contraseña'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder={isEnglish ? 'Repeat your password' : 'Repetí tu contraseña'}
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
                    <span>{isEnglish ? 'Sending code...' : 'Enviando código...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isEnglish ? 'Continue' : 'Continuar'}</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">
                {isEnglish 
                  ? 'By continuing, we will send you a verification code to your email.' 
                  : 'Al continuar, te enviaremos un código de verificación a tu email.'}
              </p>
            </div>
          ) : (
            // PASO 2: Código de verificación
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Código de verificación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2">
                  {isEnglish ? 'Verification Code' : 'Código de verificación'}
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
                  {isEnglish ? 'Check your email (including spam)' : 'Revisá tu email (incluyendo spam)'}
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
                    <span>{isEnglish ? 'Activating account...' : 'Activando cuenta...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>{isEnglish ? 'Activate Account' : 'Activar Cuenta'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                className="w-full text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition flex items-center justify-center gap-2"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isEnglish ? 'Resending...' : 'Reenviando...'}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>{isEnglish ? 'Didn\'t receive it? Resend code' : '¿No te llegó? Reenviar código'}</span>
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">
                {isEnglish 
                  ? 'The code expires in 15 minutes. If you don\'t receive it, check your spam folder.' 
                  : 'El código expira en 15 minutos. Si no lo recibís, revisá tu carpeta de spam.'}
              </p>
            </form>
          )}
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
