'use client';

import { useState, useEffect } from 'react';
import { PLANS, PlanFeatures, PlanType, getPlan, isTrialAvailable } from '@/config/plans';

export const usePlanFeatures = () => {
  const [planId, setPlanId] = useState<PlanType>('trial');
  const [isActive, setIsActive] = useState(true);
  
  useEffect(() => {
    // Cargar plan desde localStorage
    const subscription = localStorage.getItem('subscription');
    if (subscription) {
      try {
        const subData = JSON.parse(subscription);
        setPlanId(subData.plan || 'trial');
        setIsActive(subData.active !== false);
      } catch {}
    }
  }, []);
  
  const plan = getPlan(planId);
  
  // Verificar si el plan trial expiró (después del 1 de febrero)
  const isTrialExpired = planId === 'trial' && !isTrialAvailable();
  
  // Verificar si el tenant está activo y el plan no expiró
  const isActiveAndValid = isActive && !isTrialExpired;
  
  return {
    planId,
    planName: plan.name,
    price: plan.price,
    maxUsers: plan.maxUsers,
    
    // Features
    hasGestion: isActiveAndValid && plan.hasGestion,
    hasCRM: isActiveAndValid && plan.hasCRM,
    hasWhatsAppIntegration: isActiveAndValid && plan.hasWhatsAppIntegration,
    hasAI: isActiveAndValid && plan.hasAI,
    hasAutoAppointments: isActiveAndValid && plan.hasAutoAppointments,
    hasManualAppointments: isActiveAndValid && plan.hasManualAppointments,
    hasIntegrations: isActiveAndValid && plan.hasIntegrations,
    hasAdvancedReports: isActiveAndValid && plan.hasAdvancedReports,
    
    // Estados
    isTrialExpired,
    isActive: isActiveAndValid,
    isTrial: planId === 'trial',
    isBasic: planId === 'basic',
    isPro: planId === 'pro',
    
    // Helpers
    canAddUser: (currentUsers: number) => currentUsers < plan.maxUsers,
    
    // Para mostrar upgrade prompts
    needsUpgradeFor: (feature: keyof PlanFeatures) => {
      if (feature === 'hasCRM' && !plan.hasCRM) return 'basic';
      if (feature === 'hasWhatsAppIntegration' && !plan.hasWhatsAppIntegration) return 'pro';
      if (feature === 'hasAI' && !plan.hasAI) return 'pro';
      if (feature === 'hasAutoAppointments' && !plan.hasAutoAppointments) return 'pro';
      if (feature === 'hasIntegrations' && !plan.hasIntegrations) return 'basic';
      return null;
    },
  };
};
