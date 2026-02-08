'use client';

import { useState, useEffect } from 'react';
import { Check, Zap, Building2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PaymentModal from './PaymentModal';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price: number;
  yearlyPrice: number;
  icon: any;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    yearlyPrice: 99.99,
    icon: Zap,
    features: [
      '5 usuarios',
      '3 sucursales',
      'Productos ilimitados',
      'Bot de WhatsApp',
      'Reportes avanzados',
      'Soporte prioritario'
    ],
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 29.99,
    yearlyPrice: 299.99,
    icon: Building2,
    features: [
      'Usuarios ilimitados',
      'Sucursales ilimitadas',
      'Productos ilimitados',
      'Bot de WhatsApp',
      'Multi-tenant',
      'API access',
      'Soporte 24/7'
    ]
  }
];

export default function SubscriptionPlans() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar si el usuario está logueado
    const token = Cookies.get('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleSelectPlan = (plan: Plan) => {
    // Verificar si está logueado
    const token = Cookies.get('token');
    if (!token) {
      toast.error('Debes iniciar sesión para suscribirte');
      router.push('/iniciar-sesion');
      return;
    }

    setSelectedPlan(plan);
    setPaymentModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Elegí tu Plan</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-8">
          Seleccioná el plan que mejor se adapte a tu negocio
        </p>

        {!isLoggedIn && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg max-w-2xl mx-auto">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <AlertCircle className="h-5 w-5" />
              <span>Debes iniciar sesión para suscribirte a un plan</span>
            </div>
          </div>
        )}

        {/* Toggle Billing Cycle */}
        <div className="inline-flex items-center gap-3 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-md transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-zinc-900 shadow-sm font-medium'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-6 py-2 rounded-md transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white dark:bg-zinc-900 shadow-sm font-medium'
                : 'text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Anual
            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
              -17%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = billingCycle === 'monthly' ? plan.price : plan.yearlyPrice;
          const savings = billingCycle === 'yearly' ? (plan.price * 12 - plan.yearlyPrice).toFixed(2) : 0;

          return (
            <Card
              key={plan.id}
              className={`relative p-8 ${
                plan.popular
                  ? 'border-2 border-blue-500 dark:border-blue-400 shadow-lg'
                  : 'border dark:border-zinc-800'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Más Popular
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">${price}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    USD/{billingCycle === 'monthly' ? 'mes' : 'año'}
                  </span>
                </div>
                {billingCycle === 'yearly' && savings > 0 && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                    Ahorrás ${savings} USD al año
                  </p>
                )}
              </div>

              <Button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full mb-6 ${
                  plan.popular
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-900'
                }`}
              >
                Seleccionar Plan
              </Button>

              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          plan={selectedPlan.id as 'pro' | 'enterprise'}
          billingCycle={billingCycle}
          amount={billingCycle === 'monthly' ? selectedPlan.price : selectedPlan.yearlyPrice}
        />
      )}
    </div>
  );
}
