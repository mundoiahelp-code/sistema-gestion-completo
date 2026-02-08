'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import Cookies from 'js-cookie';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  plan: 'pro' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
  amount: number;
}

interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  expiresAt: string;
}

interface TransferData {
  banco: string;
  titular: string;
  cbu: string;
  alias: string;
}

export default function PaymentModal({ open, onClose, plan, billingCycle, amount }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [transferData, setTransferData] = useState<TransferData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutos en segundos
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  // Crear pago al abrir el modal
  useEffect(() => {
    if (open && !payment) {
      createPayment();
    }
  }, [open]);

  // Timer countdown
  useEffect(() => {
    if (!payment) return;

    const interval = setInterval(() => {
      const expiresAt = new Date(payment.expiresAt);
      const now = new Date();
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        toast.error('El tiempo de pago expiró');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [payment]);

  const createPayment = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('token');
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/payments`,
        {
          plan,
          billingCycle,
          paymentMethod: 'mercadopago',
          autoRenew: false
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setPayment(response.data.payment);
      setTransferData(response.data.transferData);
    } catch (error: any) {
      console.error('Error creando pago:', error);
      toast.error(error.response?.data?.error || 'Error al crear pago');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async () => {
    if (!payment || verifying) return;

    try {
      setVerifying(true);
      const token = Cookies.get('token');

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/payments/verify`,
        { paymentId: payment.id },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.verified) {
        setVerified(true);
        toast.success('¡Pago confirmado! Suscripción activada');
        setTimeout(() => {
          onClose();
          window.location.reload(); // Recargar para actualizar el estado
        }, 2000);
      } else {
        toast.warning(response.data.message);
      }
    } catch (error: any) {
      console.error('Error verificando pago:', error);
      toast.error(error.response?.data?.error || 'Error al verificar pago');
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
            <p className="text-zinc-500">Creando pago...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (verified) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">¡Pago Confirmado!</h3>
            <p className="text-zinc-500 text-center">
              Tu suscripción ha sido activada exitosamente
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Completar Pago</span>
            <button onClick={onClose} className="hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        {payment && transferData && (
          <div className="space-y-6">
            {/* Timer */}
            <div className={`p-4 rounded-lg border-2 ${
              timeRemaining < 120 
                ? 'bg-red-500/10 border-red-500' 
                : 'bg-blue-500/10 border-blue-500'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">Tiempo restante:</span>
                <span className={`text-2xl font-mono font-bold ${
                  timeRemaining < 120 ? 'text-red-500' : 'text-blue-500'
                }`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              {timeRemaining < 120 && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  ⚠️ El pago expirará pronto
                </p>
              )}
            </div>

            {/* Instrucciones */}
            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                Instrucciones
              </h3>
              <ol className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li>1. Abrí tu app de banco o MercadoPago</li>
                <li>2. Transferí el monto exacto a los datos de abajo</li>
                <li>3. Volvé acá y hacé click en "Confirmar Pago"</li>
                <li>4. El sistema verificará automáticamente tu pago</li>
              </ol>
            </div>

            {/* Datos de Transferencia */}
            <div className="rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-800/50">
              <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-3">
                <h3 className="font-semibold">💰 Transferí a estos datos:</h3>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Monto */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">Monto a transferir:</span>
                    <span className="text-2xl font-bold text-blue-500">
                      ${amount} USD
                    </span>
                  </div>
                </div>

                {/* Banco */}
                <DataField
                  label="🏦 Banco"
                  value={transferData.banco}
                  onCopy={() => copyToClipboard(transferData.banco, 'banco')}
                  copied={copiedField === 'banco'}
                />

                {/* Titular */}
                <DataField
                  label="👤 Titular"
                  value={transferData.titular}
                  onCopy={() => copyToClipboard(transferData.titular, 'titular')}
                  copied={copiedField === 'titular'}
                />

                {/* CBU */}
                <DataField
                  label="💳 CBU"
                  value={transferData.cbu}
                  onCopy={() => copyToClipboard(transferData.cbu, 'cbu')}
                  copied={copiedField === 'cbu'}
                  mono
                />

                {/* ALIAS */}
                <DataField
                  label="🔖 ALIAS"
                  value={transferData.alias}
                  onCopy={() => copyToClipboard(transferData.alias, 'alias')}
                  copied={copiedField === 'alias'}
                  highlight
                />
              </div>
            </div>

            {/* Botón Confirmar */}
            <Button
              onClick={verifyPayment}
              disabled={verifying || timeRemaining === 0}
              className="w-full h-12 text-lg"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Verificando pago...
                </>
              ) : (
                'Confirmar Pago'
              )}
            </Button>

            <p className="text-xs text-center text-zinc-500">
              El sistema verificará automáticamente si el pago fue recibido
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface DataFieldProps {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  mono?: boolean;
  highlight?: boolean;
}

function DataField({ label, value, onCopy, copied, mono, highlight }: DataFieldProps) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      highlight 
        ? 'bg-green-500/10 border border-green-500/20' 
        : 'bg-zinc-50 dark:bg-zinc-800'
    }`}>
      <div className="flex-1">
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{label}</div>
        <div className={`font-medium ${mono ? 'font-mono text-sm' : ''} ${
          highlight ? 'text-green-600 dark:text-green-400 text-lg' : ''
        }`}>
          {value}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCopy}
        className="ml-2"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
