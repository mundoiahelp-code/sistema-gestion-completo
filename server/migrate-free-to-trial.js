const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateFreeToTrial() {
  try {
    console.log('🔄 Migrando planes FREE a TRIAL...');
    
    // 1. Actualizar todos los tenants con plan "free" a "trial"
    const result = await prisma.tenant.updateMany({
      where: {
        plan: 'free'
      },
      data: {
        plan: 'trial'
      }
    });
    
    console.log(`✅ ${result.count} tenants actualizados de FREE a TRIAL`);
    
    // 2. Setear planExpires en tenants trial que no lo tienen
    const trialsWithoutExpires = await prisma.tenant.findMany({
      where: {
        plan: 'trial',
        planExpires: null
      }
    });
    
    console.log(`\n🔄 Seteando planExpires en ${trialsWithoutExpires.length} tenants trial...`);
    
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
      
      console.log(`  ✓ ${tenant.name}: expira ${expiresDate.toLocaleDateString('es-AR')}`);
    }
    
    // 3. Setear planExpires en tenants pagos que no lo tienen (usar nextPaymentDate)
    const paidWithoutExpires = await prisma.tenant.findMany({
      where: {
        plan: { not: 'trial' },
        planExpires: null,
        nextPaymentDate: { not: null }
      }
    });
    
    console.log(`\n🔄 Seteando planExpires en ${paidWithoutExpires.length} tenants pagos...`);
    
    for (const tenant of paidWithoutExpires) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { 
          planExpires: tenant.nextPaymentDate
        }
      });
      
      console.log(`  ✓ ${tenant.name}: expira ${tenant.nextPaymentDate?.toLocaleDateString('es-AR')}`);
    }
    
    // 4. Resetear lastActivityAt en tenants inactivos o sin usuarios
    console.log('\n🔄 Limpiando lastActivityAt en tenants sin actividad real...');
    
    const allTenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    
    let cleaned = 0;
    for (const tenant of allTenants) {
      // Si no tiene usuarios o está inactivo, resetear lastActivityAt a null
      if (tenant._count.users === 0 || !tenant.active) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { lastActivityAt: null }
        });
        cleaned++;
      }
    }
    
    console.log(`✅ ${cleaned} tenants limpiados (sin usuarios o inactivos)`);
    
    // Mostrar resumen final
    const summary = await prisma.tenant.groupBy({
      by: ['plan'],
      _count: true
    });
    
    console.log('\n📊 Resumen de planes:');
    summary.forEach(s => {
      console.log(`  - ${s.plan.toUpperCase()}: ${s._count} tenants`);
    });
    
  } catch (error) {
    console.error('❌ Error migrando planes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateFreeToTrial();
