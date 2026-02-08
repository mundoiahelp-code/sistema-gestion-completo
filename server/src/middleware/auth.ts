import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  };
  tenant?: {
    id: string;
    name: string;
    plan: string;
    isExpired: boolean;
    daysRemaining: number;
    nextPaymentDate: Date | null;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, active: true, tenantId: true }
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Usuario no válido' });
    }

    req.user = user;

    // Obtener info del tenant para verificar suscripción
    if (user.tenantId && user.role !== 'SUPER_ADMIN') {
      const tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: { 
          id: true, 
          name: true, 
          plan: true, 
          planExpires: true, 
          nextPaymentDate: true, 
          paymentStatus: true, 
          active: true 
        }
      });

      if (tenant) {
        const now = new Date();
        // Usar planExpires si existe, sino nextPaymentDate
        const expirationDate = tenant.planExpires ? new Date(tenant.planExpires) : 
                               tenant.nextPaymentDate ? new Date(tenant.nextPaymentDate) : null;
        const isExpired = expirationDate ? now > expirationDate : false;
        const daysRemaining = expirationDate ? Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        req.tenant = {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          isExpired,
          daysRemaining,
          nextPaymentDate: expirationDate
        };

        // Actualizar última actividad solo si el tenant está activo (sin await para no bloquear)
        if (tenant.active) {
          prisma.tenant.update({
            where: { id: user.tenantId },
            data: { lastActivityAt: now }
          }).catch(() => {}); // Ignorar errores silenciosamente
        }
      }
    }

    next();
  } catch (error) {
    // Solo loguear en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error en authenticate:', error);
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }
    next();
  };
};

// Middleware para verificar si la suscripción está activa
export const checkSubscription = (req: AuthRequest, res: Response, next: NextFunction) => {
  // SUPER_ADMIN siempre tiene acceso
  if (req.user?.role === 'SUPER_ADMIN') {
    return next();
  }

  // Verificar si el tenant está activo
  if (req.tenant && !req.tenant.isExpired) {
    return next();
  }

  // Si el tenant está vencido, bloquear
  if (req.tenant?.isExpired) {
    return res.status(402).json({ 
      error: 'subscription_expired',
      message: 'Tu suscripción ha vencido',
      isExpired: true,
      plan: req.tenant.plan,
      expiredAt: req.tenant.nextPaymentDate
    });
  }

  // Si no hay información del tenant, verificar si es trial vencido
  const plan = req.tenant?.plan || 'trial';
  if (plan === 'trial') {
    // Trial expira el 01/02/2025
    const trialExpiration = new Date('2025-02-01');
    const now = new Date();
    
    if (now > trialExpiration) {
      return res.status(402).json({
        error: 'trial_expired',
        message: 'Tu período de prueba ha finalizado',
        isExpired: true,
        plan: 'trial',
        expiredAt: trialExpiration
      });
    }
  }

  next();
};
