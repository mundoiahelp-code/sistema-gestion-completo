'use client';

import { useState, useEffect } from 'react';
import { X, Check, Loader2, Clock, Copy, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: 'basic' | 'pro';
  userData: {
    name: string;
    email: string;
    phone: string;
  };
  paymentMethod: 'mercadopago' | 'crypto';
}

export default function PaymentModal({ isOpen, onClose, plan, userData, paymentMethod }: PaymentModalProps) {
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutos en segundos
  const [verifying, setVerifying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'expired'>('pending');

  const planConfig = plan === 'basic' 
    ? { name: 'Básico', priceUSD: 59, oldPriceUSD: 89, priceARS: 59000 }
    : { name: 'Pro', priceUSD: 179, oldPriceUSD: 249, priceARS: 179000 };

  // Crear pago al abrir el modal
  useEffect(() => {
    if (isOpen) {
      createPayment();
    }
  }, [isOpen]);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || paymentStatus !== 'pending') return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setPaymentStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, paymentStatus]);

  // Polling automático cada 5 segundos
  useEffect(() => {
    if (!isOpen || !paymentData || paymentStatus !== 'pending') return;

    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, paymentData, paymentStatus]);

  const createPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/payments/public/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          billingCycle: 'monthly',
          paymentMethod,
          autoRenew: false,
          ownerName: userData.name,
          email: userData.email,
          phone: userData.phone
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear pago');

      setPaymentData(data);
      setTimeRemaining(600); // Reset timer
    } catch (error: any) {
      toast.error(error.message || 'Error al crear pago');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!paymentData?.payment?.id) return;

    try {
      const res = await fetch(`${API_URL}/payments/public/${paymentData.payment.id}/status`);
      const data = await res.json();

      if (data.payment.status === 'completed') {
        setPaymentStatus('completed');
        toast.success('¡Pago confirmado! Activando tu cuenta...');
        
        // Redirigir después de 2 segundos
        setTimeout(() => {
          window.location.href = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.clodeb.com'}/activar-cuenta?email=${encodeURIComponent(userData.email)}&verified=true`;
        }, 2000);
      } else if (data.payment.status === 'expired') {
        setPaymentStatus('expired');
      }
    } catch (error) {
      console.error('Error verificando pago:', error);
    }
  };

  const handleVerifyPayment = async () => {
    if (!paymentData?.payment?.id) return;

    setVerifying(true);
    try {
      const res = await fetch(`${API_URL}/payments/public/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: paymentData.payment.id })
      });

      const data = await res.json();

      if (data.verified) {
        setPaymentStatus('completed');
        toast.success('¡Pago confirmado! Activando tu cuenta...');
        
        setTimeout(() => {
          window.location.href = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.clodeb.com}/activar-cuenta?email=${encodeURIComponent(userData.email)}&verified=true`;
        }, 2000);
      } else {
        toast.info(data.message || 'Pago no encontrado aún. Seguimos verificando automáticamente...');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al verificar pago');
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl"
        >
          <div className="bg-gradient-to-b from-[#18181b] to-[#0f0f12] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>

            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-violet-400 mx-auto mb-4" />
                <p className="text-white/60">Preparando tu pago...</p>
              </div>
            ) : paymentStatus === 'completed' ? (
              <div className="p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-6"
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">¡Pago confirmado!</h2>
                <p className="text-white/60 text-lg">Activando tu cuenta...</p>
              </div>
            ) : paymentStatus === 'expired' ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Tiempo expirado</h2>
                <p className="text-white/60 text-lg mb-6">El tiempo para realizar el pago ha expirado</p>
                <button
                  onClick={() => {
                    setPaymentStatus('pending');
                    createPayment();
                  }}
                  className="bg-violet-500 hover:bg-violet-600 text-white font-medium px-8 py-3 rounded-xl transition"
                >
                  Intentar nuevamente
                </button>
              </div>
            ) : (
              <div className="p-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 mb-4">
                    <span className="text-sm font-medium text-violet-400">Plan {planConfig.name}</span>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {paymentMethod === 'crypto' ? `USD $${planConfig.priceUSD}` : `$${planConfig.priceARS.toLocaleString('es-AR')}`}
                  </h2>
                  <p className="text-white/60">Realizá la transferencia y confirmá el pago</p>
                  {paymentMethod === 'mercadopago' && (
                    <p className="text-white/40 text-sm mb-2">≈ USD ${planConfig.priceUSD} al cambio oficial</p>
                  )}
                </div>

                {/* Timer */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${timeRemaining < 120 ? 'text-red-400' : 'text-violet-400'}`} />
                    <div>
                      <p className="text-white/60 text-sm">Tiempo restante</p>
                      <p className={`text-xl font-bold ${timeRemaining < 120 ? 'text-red-400' : 'text-white'}`}>
                        {formatTime(timeRemaining)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40 text-xs">Verificación automática activa</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400 text-sm">Cada 5 segundos</span>
                    </div>
                  </div>
                </div>

                {/* Datos de transferencia */}
                {paymentMethod === 'mercadopago' && paymentData?.transferData && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      💳 Datos para transferencia
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white/40 text-xs mb-1">ALIAS</p>
                          <p className="text-white font-mono">{paymentData.transferData.alias}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(paymentData.transferData.alias, 'Alias')}
                          className="p-2 hover:bg-white/10 rounded-lg transition"
                        >
                          <Copy className="w-4 h-4 text-white/60" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white/40 text-xs mb-1">CBU</p>
                          <p className="text-white font-mono text-sm">{paymentData.transferData.cbu}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(paymentData.transferData.cbu, 'CBU')}
                          className="p-2 hover:bg-white/10 rounded-lg transition"
                        >
                          <Copy className="w-4 h-4 text-white/60" />
                        </button>
                      </div>
                      
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white/40 text-xs mb-1">TITULAR</p>
                        <p className="text-white">{paymentData.transferData.titular}</p>
                      </div>
                      
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-white/40 text-xs mb-1">BANCO</p>
                        <p className="text-white">{paymentData.transferData.banco}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Datos de crypto */}
                {paymentMethod === 'crypto' && paymentData?.walletData && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                    <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                      ₿ Enviar USDT (TRC20)
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex-1 mr-2">
                          <p className="text-white/40 text-xs mb-1">DIRECCIÓN</p>
                          <p className="text-white font-mono text-sm break-all">{paymentData.walletData.address}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(paymentData.walletData.address, 'Dirección')}
                          className="p-2 hover:bg-white/10 rounded-lg transition flex-shrink-0"
                        >
                          <Copy className="w-4 h-4 text-white/60" />
                        </button>
                      </div>
                      
                      <div className="p-3 bg-white/5 rounded-lg text-center">
                        <p className="text-white/40 text-xs mb-2">RED</p>
                        <p className="text-white font-semibold">{paymentData.walletData.network}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Instrucciones */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                  <p className="text-blue-400 text-sm font-medium mb-2">📋 Instrucciones:</p>
                  <ol className="text-white/60 text-sm space-y-1 list-decimal list-inside">
                    <li>Realizá la transferencia por el monto exacto</li>
                    <li>Esperá unos segundos (verificación automática)</li>
                    <li>Hacé clic en "Confirmar Pago" para verificar manualmente</li>
                    <li>Tu cuenta se activará automáticamente al confirmar</li>
                  </ol>
                </div>

                {/* Botón confirmar */}
                <button
                  onClick={handleVerifyPayment}
                  disabled={verifying}
                  className="w-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white font-semibold py-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verificando pago...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Confirmar Pago
                    </>
                  )}
                </button>

                <p className="text-white/40 text-xs text-center mt-4">
                  El sistema verifica automáticamente cada 5 segundos. No es necesario que hagas clic en "Confirmar Pago" repetidamente.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
