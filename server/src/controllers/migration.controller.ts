import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Migrar planes FREE a TRIAL y setear fechas de expiración
export const migrateFreeToTrial = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔄 Iniciando migración FREE → TRIAL...');
    
    // 1. Actualizar todos los tenants con plan "free" a "trial"
    const freeToTrial = await prisma.tenant.updateMany({
      where: { plan: 'free' },
      data: { plan: 'trial' }
    });
    
    console.log(`✅ ${freeToTrial.count} tenants actualizados de FREE a TRIAL`);
    
    // 2. Setear planExpires en tenants trial que no lo tienen
    const trialsWithoutExpires = await prisma.tenant.findMany({
      where: {
        plan: 'trial',
        planExpires: null
      }
    });
    
    console.log(`🔄 Seteando planExpires en ${trialsWithoutExpires.length} tenants trial...`);
    
    for (const tenant of trialsWithoutExpires) {
      const startDate = tenant.planStartDate || tenant.createdAt;
      const expiresDate = new Date(startDate);
      expiresDate.setDate(expiresDate.getDate() + 14); // 14 días de trial
      
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { 
          planExpires: expiresDate,
          planStartDate: startDate
        }
      });
    }
    
    // 3. Setear planExpires en tenants pagos que no lo tienen
    const paidWithoutExpires = await prisma.tenant.findMany({
      where: {
        plan: { not: 'trial' },
        planExpires: null,
        nextPaymentDate: { not: null }
      }
    });
    
    console.log(`🔄 Seteando planExpires en ${paidWithoutExpires.length} tenants pagos...`);
    
    for (const tenant of paidWithoutExpires) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { planExpires: tenant.nextPaymentDate }
      });
    }
    
    // 4. Limpiar lastActivityAt en tenants sin usuarios
    const allTenants = await prisma.tenant.findMany({
      include: {
        _count: { select: { users: true } }
      }
    });
    
    let cleaned = 0;
    for (const tenant of allTenants) {
      if (tenant._count.users === 0) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { lastActivityAt: null }
        });
        cleaned++;
      }
    }
    
    console.log(`✅ ${cleaned} tenants limpiados (sin usuarios)`);
    
    // Resumen
    const summary = await prisma.tenant.groupBy({
      by: ['plan'],
      _count: true
    });
    
    res.json({
      success: true,
      message: 'Migración completada',
      stats: {
        freeToTrial: freeToTrial.count,
        trialsFixed: trialsWithoutExpires.length,
        paidFixed: paidWithoutExpires.length,
        cleaned,
        summary: summary.map(s => ({ plan: s.plan, count: s._count }))
      }
    });
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    res.status(500).json({ error: 'Error en migración', details: error instanceof Error ? error.message : 'Unknown error' });
  }
};
