'use client';

import { AlertTriangle, CreditCard, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

interface SubscriptionBlockProps {
  isAdmin: boolean;
  plan: string;
  expiredAt?: string;
  onLogout: () => void;
}

export default function SubscriptionBlock({ isAdmin, plan, expiredAt, onLogout }: SubscriptionBlockProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = (method: 'mercadopago' | 'crypto') => {
    setLoading(true);
    // Redirigir a la página de pago
    const planPrice = plan === 'pro' ? 25000 : 15000;
    const planPriceUSD = plan === 'pro' ? 25 : 15;
    
    if (method === 'mercadopago') {
      window.location.href = `/planes?plan=${plan}&price=${planPrice}`;
    } else {
      window.location.href = `/planes?plan=${plan}&price=${planPriceUSD}&method=crypto`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Suscripción Vencida</h1>
        
        {isAdmin ? (
          <>
            <p className="text-gray-500 mb-6">
              Tu período de prueba o suscripción ha finalizado. 
              Renovar para seguir usando el sistema.
            </p>

            <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Plan actual</p>
              <p className="font-semibold text-lg capitalize">{plan}</p>
              {expiredAt && (
                <p className="text-xs text-gray-400 mt-1">
                  Venció el {new Date(expiredAt).toLocaleDateString('es-AR')}
                </p>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={() => handlePayment('mercadopago')}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
                Pagar con MercadoPago
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handlePayment('crypto')}
                disabled={loading}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Pagar con Crypto (USDT)
              </Button>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              ¿Necesitás ayuda? Contactanos por WhatsApp
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-500 mb-6">
              La suscripción de tu negocio ha vencido. 
              Contactá al administrador para renovarla.
            </p>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Solo el administrador puede realizar el pago para reactivar el sistema.
              </p>
            </div>
          </>
        )}

        <Button variant="ghost" onClick={onLogout} className="text-gray-500">
          Cerrar sesión
        </Button>
      </Card>
    </div>
  );
}
