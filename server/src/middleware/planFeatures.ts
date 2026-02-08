import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Configuración de features por plan
 * Define qué funcionalidades tiene acceso cada plan
 */
const PLAN_FEATURES = {
  trial: {
    crm: false,
    bot: false,
    whatsapp: false,
    onlineTurnos: false,
    integrations: false,
    advancedReports: false
  },
  basic: {
    crm: true,
    bot: false,
    whatsapp: true, // Solo manual, sin bot
    onlineTurnos: false,
    integrations: true,
    advancedReports: false
  },
  pro: {
    crm: true,
    bot: true,
    whatsapp: true,
    onlineTurnos: true,
    integrations: true,
    advancedReports: true
  }
} as const;

type PlanType = keyof typeof PLAN_FEATURES;
type FeatureType = keyof typeof PLAN_FEATURES.trial;

/**
 * Middleware para validar que el plan del tenant tenga acceso a una feature específica
 * SUPER_ADMIN siempre tiene acceso (bypass)
 */
export const requireFeature = (feature: FeatureType) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // SUPER_ADMIN siempre tiene acceso
    if (req.user?.role === 'SUPER_ADMIN') {
      return next();
    }

    const plan = (req.tenant?.plan || 'trial') as PlanType;
    const planConfig = PLAN_FEATURES[plan];

    if (!planConfig) {
      return res.status(500).json({
        error: 'Plan no válido',
        plan
      });
    }

    const hasFeature = planConfig[feature];

    if (!hasFeature) {
      // Determinar qué plan se necesita
      let requiredPlan: string;
      if (feature === 'bot' || feature === 'onlineTurnos' || feature === 'advancedReports') {
        requiredPlan = 'pro';
      } else {
        requiredPlan = 'basic';
      }

      return res.status(403).json({
        error: 'Feature no disponible en tu plan',
        feature,
        currentPlan: plan,
        requiredPlan,
        message: `Esta funcionalidad requiere el plan ${requiredPlan === 'pro' ? 'Profesional' : 'Básico'}`,
        upgradeUrl: '/suscripcion'
      });
    }

    next();
  };
};

/**
 * Helper para verificar si un plan tiene acceso a una feature
 * Útil para lógica condicional en controladores
 */
export const hasPlanFeature = (plan: string, feature: FeatureType): boolean => {
  const planConfig = PLAN_FEATURES[plan as PlanType];
  if (!planConfig) return false;
  return planConfig[feature];
};
