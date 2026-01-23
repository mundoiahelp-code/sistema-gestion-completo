// Configuración de planes del sistema
export type PlanType = 'trial' | 'basic' | 'pro';

export interface PlanFeatures {
  name: string;
  price: number;
  maxUsers: number;
  hasGestion: boolean;
  hasCRM: boolean;
  hasWhatsAppIntegration: boolean; // Conectar WhatsApp (QR) - Básico: solo CRM, Pro: CRM + Bot
  hasAI: boolean; // Bot IA
  hasAutoAppointments: boolean;
  hasManualAppointments: boolean;
  trialDays?: number;
  expiresAt?: Date;
}

export const PLANS: Record<PlanType, PlanFeatures> = {
  trial: {
    name: 'Prueba Gratuita',
    price: 0,
    maxUsers: 4,
    hasGestion: true,
    hasCRM: false,
    hasWhatsAppIntegration: false,
    hasAI: false,
    hasAutoAppointments: false,
    hasManualAppointments: true,
    trialDays: 7,
    expiresAt: new Date('2025-02-01'),
  },
  basic: {
    name: 'Básico',
    price: 45000,
    maxUsers: 8,
    hasGestion: true,
    hasCRM: true, // Ver mensajes en CRM
    hasWhatsAppIntegration: true, // Puede conectar WhatsApp para CRM (sin bot)
    hasAI: false, // NO tiene bot IA
    hasAutoAppointments: false,
    hasManualAppointments: true,
  },
  pro: {
    name: 'Profesional',
    price: 109000,
    maxUsers: 18,
    hasGestion: true,
    hasCRM: true,
    hasWhatsAppIntegration: true,
    hasAI: true, // Tiene bot IA
    hasAutoAppointments: true,
    hasManualAppointments: true,
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
