'use client';

import { useEffect, useState } from 'react';
import { X, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlanExpirationBannerProps {
  planExpires: string | null;
  planStatus?: string;
}

export default function PlanExpirationBanner({ planExpires, planStatus }: PlanExpirationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!planExpires) return;

    const expires = new Date(planExpires);
    const now = new Date();
    const diff = expires.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    setDaysLeft(days);

    // Si el paymentStatus es "expired" pero todavía tiene días, es acceso extendido (ROJO)
    if (planStatus === 'expired' && days > 0) {
      setIsExpired(true);
      setIsVisible(true);
    }
    // Si quedan 7 días o menos (AMARILLO)
    else if (days <= 7 && days > 0) {
      setIsExpired(false);
      setIsVisible(true);
    }
    // Si ya no tiene días (completamente vencido)
    else if (days <= 0) {
      setIsExpired(true);
      setIsVisible(true);
    }
  }, [planExpires, planStatus]);

  if (!isVisible) return null;

  const expirationDate = planExpires ? new Date(planExpires).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }) : '';

  return (
    <div className={`relative ${
      isExpired 
        ? 'bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800'
        : 'bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpired ? (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            )}
            <div>
              <p className={`text-sm font-medium ${
                isExpired 
                  ? 'text-red-800 dark:text-red-200'
                  : 'text-yellow-800 dark:text-yellow-200'
              }`}>
                {isExpired ? (
                  <>
                    Tu plan ha expirado. Tienes acceso extendido hasta el <span className="font-bold">{expirationDate}</span>
                  </>
                ) : (
                  <>
                    Tu plan vence en <span className="font-bold">{daysLeft} {daysLeft === 1 ? 'día' : 'días'}</span> (el {expirationDate})
                  </>
                )}
              </p>
              <p className={`text-xs mt-0.5 ${
                isExpired 
                  ? 'text-red-600 dark:text-red-300'
                  : 'text-yellow-600 dark:text-yellow-300'
              }`}>
                {isExpired ? (
                  <>
                    Visitá{' '}
                    <a 
                      href="https://www.Clodeb.store" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-semibold underline hover:text-red-700 dark:hover:text-red-200"
                    >
                      www.Clodeb.store
                    </a>
                    {' '}para renovar tu suscripción y evitar la suspensión del servicio.
                  </>
                ) : (
                  'Asegúrate de renovar tu suscripción para continuar sin interrupciones.'
                )}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className={`flex-shrink-0 ${
              isExpired
                ? 'hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400'
                : 'hover:bg-yellow-100 dark:hover:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400'
            }`}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
