'use client';

import { useState, useEffect } from 'react';

export type PlanType = 'trial' | 'basic' | 'pro';

interface PlanFeatures {
  crm: boolean;
  bot: boolean;
  integrations: boolean;
  onlineTurnos: boolean;
  advancedReports: boolean;
  maxUsers: number;
  maxStores: number;
}

const planFeatures: Record<PlanType, PlanFeatures> = {
  trial: {
    crm: false,
    bot: false,
    integrations: false,
    onlineTurnos: false,
    advancedReports: false,
    maxUsers: 4,
    maxStores: 2,
  },
  basic: {
    crm: true, // Básico puede ver CRM y conectar WhatsApp para mensajes
    bot: false, // Pero NO tiene bot IA
    integrations: false, // NO tiene acceso a Ajustes > Integraciones (eso es para bot)
    onlineTurnos: false,
    advancedReports: false,
    maxUsers: 8,
    maxStores: 5,
  },
  pro: {
    crm: true,
    bot: true,
    integrations: true, // Puede configurar bot desde Ajustes > Integraciones
    onlineTurnos: true,
    advancedReports: true,
    maxUsers: 18,
    maxStores: 10,
  },
};

export function usePlan() {
  const [plan, setPlan] = useState<PlanType>('trial');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscription = localStorage.getItem('subscription');
    if (subscription) {
      try {
        const data = JSON.parse(subscription);
        setPlan((data.plan as PlanType) || 'trial');
      } catch {}
    }
    setLoading(false);
  }, []);

  const features = planFeatures[plan] || planFeatures.trial;

  const canAccess = (feature: keyof PlanFeatures): boolean => {
    return features[feature] as boolean;
  };

  const isPro = plan === 'pro';
  const isBasic = plan === 'basic';
  const isTrial = plan === 'trial';

  return {
    plan,
    features,
    canAccess,
    isPro,
    isBasic,
    isTrial,
    loading,
  };
}
