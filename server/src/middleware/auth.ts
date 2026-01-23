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
        select: { id: true, name: true, plan: true, nextPaymentDate: true, paymentStatus: true, active: true }
      });

      if (tenant) {
        const now = new Date();
        const nextPayment = tenant.nextPaymentDate ? new Date(tenant.nextPaymentDate) : null;
        const isExpired = nextPayment ? now > nextPayment : false;
        const daysRemaining = nextPayment ? Math.ceil((nextPayment.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        req.tenant = {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          isExpired,
          daysRemaining,
          nextPaymentDate: nextPayment
        };
      }
    }

    next();
  } catch (error) {
    console.error('Error en authenticate:', error);
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

  next();
};
