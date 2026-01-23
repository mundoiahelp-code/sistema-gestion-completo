import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware de autenticación para bots
 * Permite que los bots se autentiquen usando X-Tenant-ID header
 */
export const authenticateBot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(401).json({ error: 'X-Tenant-ID header requerido' });
    }

    // Verificar que el tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        plan: true,
        botPort: true,
      },
    });

    if (!tenant) {
      return res.status(401).json({ error: 'Tenant no encontrado' });
    }

    // Agregar tenant al request
    (req as any).tenant = tenant;
    (req as any).user = {
      tenantId: tenant.id,
      role: 'BOT', // Rol especial para bots
    };

    next();
  } catch (error) {
    console.error('Error en authenticateBot:', error);
    res.status(500).json({ error: 'Error de autenticación' });
  }
};
