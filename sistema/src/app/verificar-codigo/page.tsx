'use client';

import { Suspense } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sistema-gestion-production-d961.up.railway.app/api';

// Cooldowns progresivos en segundos
const COOLDOWNS = [60, 120, 300, 600]; // 1min, 2min, 5min, 10min

function VerifyCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [activationLink, setActivationLink] = useState('');
  
  // Cooldown para reenvío
  const [resendAttempts, setResendAttempts] = useState(0);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cargar estado de cooldown
  useEffect(() => {
    const saved = localStorage.getItem('verifyCodeCooldown');
    if (saved) {
      const { attempts, cooldownUntil } = JSON.parse(saved);
      setResendAttempts(attempts);
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

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 5 && newCode.every(d => d !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (codeStr?: string) => {
    const verificationCode = codeStr || code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Ingresá el código completo de 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/payments/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.tooManyAttempts) {
          setError('Demasiados intentos. Solicitá un nuevo código.');
        } else if (data.expired) {
          setError('El código expiró. Solicitá uno nuevo.');
        } else {
          setError(data.error || 'Código incorrecto');
        }
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      setSuccess(true);
      setActivationLink(data.activationLink);
      
      localStorage.removeItem('verifyCodeCooldown');
      
      setTimeout(() => {
        if (data.activationLink) {
          router.push(data.activationLink.replace(process.env.NEXT_PUBLIC_APP_URL || '', ''));
        }
      }, 2000);

    } catch (err) {
      setError('Error de conexión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldownEnd && cooldownEnd > Date.now()) return;
    
    setResending(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/payments/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.waitTime) {
          const newCooldownEnd = Date.now() + (data.waitTime * 1000);
          setCooldownEnd(newCooldownEnd);
        }
        setError(data.error || 'Error al reenviar código');
        return;
      }

      const newAttempts = resendAttempts + 1;
      setResendAttempts(newAttempts);
      
      const cooldownIndex = Math.min(newAttempts - 1, COOLDOWNS.length - 1);
      const cooldownSeconds = COOLDOWNS[cooldownIndex];
      const newCooldownEnd = Date.now() + (cooldownSeconds * 1000);
      
      setCooldownEnd(newCooldownEnd);
      localStorage.setItem('verifyCodeCooldown', JSON.stringify({
        attempts: newAttempts,
        cooldownUntil: newCooldownEnd
      }));

      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

    } catch (err) {
      setError('Error de conexión');
    } finally {
      setResending(false);
    }
  };

  const isOnCooldown = cooldownEnd && cooldownEnd > Date.now();

  if (!email) {
    return (
      <section className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-zinc-400">Email no especificado</p>
        </div>
      </section>
    );
  }


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
                alt="Clodeb"
              />
            </div>

            {success ? (
              <>
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
                  ¡Email verificado!
                </h1>
                <p className="text-gray-600 dark:text-zinc-400 text-sm">
                  Redirigiendo para activar tu cuenta...
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 mb-2">
                  Verificá tu email
                </h1>
                <p className="text-gray-600 dark:text-zinc-400 text-sm">
                  Ingresá el código de 6 dígitos que enviamos a
                </p>
                <p className="text-gray-900 dark:text-zinc-100 font-medium text-sm mt-1">
                  {email}
                </p>
              </>
            )}
          </div>

          {!success && (
            <>
              {/* Inputs OTP */}
              <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={loading}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors disabled:opacity-50"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3 mb-4">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Botón verificar */}
              <button
                onClick={() => handleVerify()}
                disabled={loading || code.some(d => d === '')}
                className="w-full h-11 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  'Verificar código'
                )}
              </button>

              {/* Reenviar código */}
              <div className="text-center">
                <p className="text-gray-500 dark:text-zinc-500 text-sm mb-2">
                  ¿No recibiste el código?
                </p>
                <button
                  onClick={handleResend}
                  disabled={resending || !!isOnCooldown}
                  className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {resending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Reenviando...</span>
                    </>
                  ) : isOnCooldown ? (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Reenviar en {formatTime(timeLeft)}</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Reenviar código</span>
                    </>
                  )}
                </button>
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-zinc-400 text-center">
                  El código expira en 15 minutos. Si no lo encontrás, revisá la carpeta de spam.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function LoadingFallback() {
  return (
    <section className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
        <p className="text-gray-500 dark:text-zinc-400 mt-2">Cargando...</p>
      </div>
    </section>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyCodeContent />
    </Suspense>
  );
}
