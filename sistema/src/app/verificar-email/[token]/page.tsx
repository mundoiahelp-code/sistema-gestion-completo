'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sistema-gestion-production-d961.up.railway.app/api';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [activationLink, setActivationLink] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await fetch(`${API_URL}/payments/verify-email/${token}`);
        const data = await res.json();
        
        if (!res.ok) {
          setStatus('error');
          setMessage(data.error || 'Error al verificar el email');
          return;
        }
        
        setStatus('success');
        setMessage(data.message || '¡Email verificado correctamente!');
        if (data.activationLink) {
          setActivationLink(data.activationLink);
          // Redirigir automáticamente después de 3 segundos
          setTimeout(() => {
            window.location.href = data.activationLink;
          }, 3000);
        }
      } catch (error) {
        setStatus('error');
        setMessage('Error de conexión. Intentá de nuevo.');
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-700 rounded-2xl flex items-center justify-center">
              <Image
                src="/images/logo-icon.png"
                width={40}
                height={40}
                alt="Clodeb"
              />
            </div>
          </div>

          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-violet-500 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verificando tu email...
              </h1>
              <p className="text-gray-500 dark:text-zinc-400">
                Esto solo toma un momento
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                ¡Email verificado!
              </h1>
              <p className="text-gray-500 dark:text-zinc-400 mb-6">
                {message}
              </p>
              {activationLink && (
                <>
                  <p className="text-sm text-gray-400 dark:text-zinc-500 mb-4">
                    Redirigiendo automáticamente...
                  </p>
                  <a
                    href={activationLink}
                    className="inline-flex items-center justify-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-medium px-6 py-3 rounded-xl transition"
                  >
                    Activar mi cuenta
                  </a>
                </>
              )}
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Error de verificación
              </h1>
              <p className="text-gray-500 dark:text-zinc-400 mb-6">
                {message}
              </p>
              <a
                href="https://mundoaple.store"
                className="inline-flex items-center justify-center gap-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium px-6 py-3 rounded-xl transition"
              >
                Volver al inicio
              </a>
            </>
          )}
        </div>

        <p className="text-center text-gray-400 dark:text-zinc-600 text-sm mt-6">
          © 2024 Clodeb
        </p>
      </div>
    </div>
  );
}
