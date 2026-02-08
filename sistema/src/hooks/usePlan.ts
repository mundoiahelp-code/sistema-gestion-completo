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
    crm: true, // Puede ver CRM y conectar WhatsApp manualmente
    bot: false, // NO tiene bot IA automático
    integrations: true, // Puede conectar WhatsApp desde Integraciones (sin bot)
    onlineTurnos: false,
    advancedReports: false,
    maxUsers: 8,
    maxStores: 5,
  },
  pro: {
    crm: true,
    bot: true, // Tiene bot IA que responde automáticamente
    integrations: true, // Puede configurar WhatsApp + Bot IA
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
