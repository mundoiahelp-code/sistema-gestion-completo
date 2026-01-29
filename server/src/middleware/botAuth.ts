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
      console.error('❌ Falta X-Tenant-ID header');
      return res.status(401).json({ error: 'X-Tenant-ID header requerido' });
    }

    console.log(`🔍 Buscando tenant: ${tenantId}`);

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
      console.error(`❌ Tenant no encontrado: ${tenantId}`);
      // Listar los primeros 5 tenants para debug
      const tenants = await prisma.tenant.findMany({
        take: 5,
        select: { id: true, name: true }
      });
      console.log('📋 Tenants disponibles:', tenants.map(t => `${t.name} (${t.id})`).join(', '));
      return res.status(401).json({ error: 'Tenant no encontrado' });
    }

    console.log(`✅ Tenant encontrado: ${tenant.name} (${tenant.plan})`);

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
