import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../lib/prisma';
import { PlanLimitError } from '../lib/errors';

// Cache de configuración de planes (se actualiza cada 5 minutos)
let cachedPlanLimits: any = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Configuración por defecto si no hay en la base de datos
const DEFAULT_PLANS = {
  trial: {
    maxUsers: 2,
    maxStores: 2,
    maxProducts: 50
  },
  basic: {
    maxUsers: 8,
    maxStores: 5,
    maxProducts: 200
  },
  pro: {
    maxUsers: 18,
    maxStores: 10,
    maxProducts: 1000
  }
} as const;

type PlanType = keyof typeof DEFAULT_PLANS;

/**
 * Obtener límites de planes desde la base de datos o caché
 */
const getPlanLimits = async () => {
  const now = Date.now();
  
  // Usar caché si es reciente
  if (cachedPlanLimits && (now - lastCacheUpdate) < CACHE_DURATION) {
    return cachedPlanLimits;
  }

  try {
    // Obtener configuración de la base de datos
    const config = await prisma.systemConfig.findFirst();
    
    if (config && config.planLimits) {
      cachedPlanLimits = config.planLimits;
      lastCacheUpdate = now;
      return cachedPlanLimits;
    }
  } catch (error) {
    console.error('Error loading plan limits from DB:', error);
  }

  // Usar configuración por defecto
  cachedPlanLimits = DEFAULT_PLANS;
  lastCacheUpdate = now;
  return DEFAULT_PLANS;
};

/**
 * Forzar actualización del caché de límites
 */
export const refreshPlanLimitsCache = () => {
  cachedPlanLimits = null;
  lastCacheUpdate = 0;
};

/**
 * Middleware para verificar límites de usuarios por plan
 * Debe aplicarse ANTES de crear un usuario
 */
export const checkUserLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // SUPER_ADMIN no tiene límites
    if (req.user?.role === 'SUPER_ADMIN') {
      return next();
    }

    const tenantId = req.user!.tenantId;
    
    // Consultar directamente sin caché para tener datos en tiempo real
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, _count: { select: { users: { where: { active: true } } } } }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }

    const planLimits = await getPlanLimits();
    const plan = planLimits[tenant.plan as PlanType];
    const currentUsers = tenant._count.users;

    if (currentUsers >= plan.maxUsers) {
      throw new PlanLimitError('usuarios', plan.maxUsers, currentUsers);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para verificar límites de sucursales por plan
 * Debe aplicarse ANTES de crear una sucursal
 */
export const checkStoreLimit = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // SUPER_ADMIN no tiene límites
    if (req.user?.role === 'SUPER_ADMIN') {
      return next();
    }

    const tenantId = req.user!.tenantId;
    
    // Consultar directamente sin caché para tener datos en tiempo real
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, _count: { select: { stores: { where: { active: true } } } } }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }

    const planLimits = await getPlanLimits();
    const plan = planLimits[tenant.plan as PlanType];
    const currentStores = tenant._count.stores;

    if (currentStores >= plan.maxStores) {
      throw new PlanLimitError('sucursales', plan.maxStores, currentStores);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Helper para verificar si un tenant puede agregar más usuarios
 */
export const canAddUser = async (tenantId: string): Promise<boolean> => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true, _count: { select: { users: true } } }
  });

  if (!tenant) return false;

  const planLimits = await getPlanLimits();
  const plan = planLimits[tenant.plan as PlanType];
  return tenant._count.users < plan.maxUsers;
};

/**
 * Helper para verificar si un tenant puede agregar más sucursales
 */
export const canAddStore = async (tenantId: string): Promise<boolean> => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plan: true, _count: { select: { stores: true } } }
  });

  if (!tenant) return false;

  const planLimits = await getPlanLimits();
  const plan = planLimits[tenant.plan as PlanType];
  return tenant._count.stores < plan.maxStores;
};

/**
 * Helper para obtener límites restantes de un tenant
 */
export const getRemainingLimits = async (tenantId: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { 
      plan: true, 
      _count: { 
        select: { 
          users: true,
          stores: true,
          products: true
        } 
      } 
    }
  });

  if (!tenant) {
    return null;
  }

  const planLimits = await getPlanLimits();
  const plan = planLimits[tenant.plan as PlanType];

  return {
    users: {
      current: tenant._count.users,
      max: plan.maxUsers,
      remaining: plan.maxUsers - tenant._count.users,
      canAdd: tenant._count.users < plan.maxUsers
    },
    stores: {
      current: tenant._count.stores,
      max: plan.maxStores,
      remaining: plan.maxStores - tenant._count.stores,
      canAdd: tenant._count.stores < plan.maxStores
    },
    products: {
      current: tenant._count.products,
      max: plan.maxProducts,
      remaining: plan.maxProducts - tenant._count.products,
      canAdd: tenant._count.products < plan.maxProducts
    }
  };
};
