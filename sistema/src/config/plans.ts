/**
 * Configuración de planes del sistema
 * FUENTE ÚNICA DE VERDAD para límites y features
 */
export type PlanType = 'trial' | 'basic' | 'pro';

export interface PlanFeatures {
  name: string;
  price: number;
  maxUsers: number;
  maxStores: number;
  hasGestion: boolean;
  hasCRM: boolean;
  hasWhatsAppIntegration: boolean;
  hasAI: boolean;
  hasAutoAppointments: boolean;
  hasManualAppointments: boolean;
  hasIntegrations: boolean;
  hasAdvancedReports: boolean;
  trialDays?: number;
  expiresAt?: Date;
}

export const PLANS: Record<PlanType, PlanFeatures> = {
  trial: {
    name: 'Prueba Gratuita',
    price: 0,
    maxUsers: 2, // Cambiado de 4 a 2 (solo el dueño + 1 persona)
    maxStores: 2,
    hasGestion: true,
    hasCRM: false,
    hasWhatsAppIntegration: false,
    hasAI: false,
    hasAutoAppointments: false,
    hasManualAppointments: true,
    hasIntegrations: false,
    hasAdvancedReports: false,
    trialDays: 14,
    expiresAt: new Date('2025-02-01T23:59:59'),
  },
  basic: {
    name: 'Básico',
    price: 45000,
    maxUsers: 8,
    maxStores: 5,
    hasGestion: true,
    hasCRM: true,
    hasWhatsAppIntegration: true, // Manual, sin bot
    hasAI: false,
    hasAutoAppointments: false,
    hasManualAppointments: true,
    hasIntegrations: true,
    hasAdvancedReports: false,
  },
  pro: {
    name: 'Profesional',
    price: 109000,
    maxUsers: 18,
    maxStores: 10,
    hasGestion: true,
    hasCRM: true,
    hasWhatsAppIntegration: true,
    hasAI: true,
    hasAutoAppointments: true,
    hasManualAppointments: true,
    hasIntegrations: true,
    hasAdvancedReports: true,
  },
};

// Helper para obtener el plan
export const getPlan = (planId: string): PlanFeatures => {
  const plan = PLANS[planId as PlanType];
  return plan || PLANS.trial;
};

// Verificar si una feature está disponible
export const hasFeature = (planId: string, feature: keyof PlanFeatures): boolean => {
  const plan = getPlan(planId);
  return !!plan[feature];
};

// Verificar si el trial sigue disponible
export const isTrialAvailable = (): boolean => {
  const trialPlan = PLANS.trial;
  if (trialPlan.expiresAt) {
    return new Date() < trialPlan.expiresAt;
  }
  return true;
};

// Verificar límite de usuarios
export const canAddUser = (planId: string, currentUsers: number): boolean => {
  const plan = getPlan(planId);
  return currentUsers < plan.maxUsers;
};

// Verificar límite de sucursales
export const canAddStore = (planId: string, currentStores: number): boolean => {
  const plan = getPlan(planId);
  return currentStores < plan.maxStores;
};
