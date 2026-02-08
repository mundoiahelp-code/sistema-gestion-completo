import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

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

    console.log(`🔍 [BOT-AUTH] Buscando tenant: ${tenantId}`);

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
      console.error(`❌ [BOT-AUTH] Tenant no encontrado: ${tenantId}`);
      // Listar TODOS los tenants para debug
      const tenants = await prisma.tenant.findMany({
        select: { id: true, name: true, plan: true }
      });
      console.log(`📋 [BOT-AUTH] Total tenants en DB: ${tenants.length}`);
      tenants.forEach(t => {
        console.log(`   - ${t.name} (${t.plan}): ${t.id}`);
      });
      return res.status(401).json({ 
        error: 'Tenant no encontrado',
        tenantId,
        availableTenants: tenants.length
      });
    }

    console.log(`✅ [BOT-AUTH] Tenant encontrado: ${tenant.name} (${tenant.plan})`);

    // Agregar tenant al request
    (req as any).tenant = tenant;
    (req as any).user = {
      tenantId: tenant.id,
      role: 'BOT', // Rol especial para bots
    };

    next();
  } catch (error) {
    console.error('❌ [BOT-AUTH] Error:', error);
    res.status(500).json({ error: 'Error de autenticación' });
  }
};
