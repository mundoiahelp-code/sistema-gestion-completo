/**
 * Script para actualizar el puerto del bot en la base de datos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateBotPort() {
  try {
    // Obtener el tenant
    const tenants = await prisma.tenant.findMany();
    
    if (tenants.length === 0) {
      console.log('❌ No hay tenants en la base de datos');
      return;
    }

    console.log(`📋 Tenants encontrados: ${tenants.length}`);
    
    for (const tenant of tenants) {
      console.log(`\n🏢 Tenant: ${tenant.name} (${tenant.id})`);
      console.log(`   Puerto actual: ${tenant.botPort || 'No configurado'}`);
      
      // Actualizar puerto a 8003
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { botPort: 8003 }
      });
      
      console.log(`   ✅ Puerto actualizado a: 8003`);
    }
    
    console.log('\n✅ Todos los puertos actualizados correctamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBotPort();
