/**
 * Script para verificar la salud del sistema
 * Verifica conexión a DB, variables de entorno, etc.
 * 
 * Uso: node scripts/health-check.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function healthCheck() {
  console.log('🏥 Verificando salud del sistema...\n');
  
  let allGood = true;
  
  // 1. Verificar conexión a base de datos
  try {
    await prisma.$connect();
    console.log('✅ Conexión a base de datos: OK');
  } catch (error) {
    console.error('❌ Conexión a base de datos: FALLO');
    console.error('   Error:', error.message);
    allGood = false;
  }
  
  // 2. Verificar variables de entorno críticas
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'PORT'
  ];
  
  const optionalEnvVars = [
    'RESEND_API_KEY',
    'ANTHROPIC_API_KEY',
    'MP_ACCESS_TOKEN'
  ];
  
  console.log('\n📋 Variables de entorno requeridas:');
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Configurada`);
    } else {
      console.log(`❌ ${varName}: FALTA`);
      allGood = false;
    }
  });
  
  console.log('\n📋 Variables de entorno opcionales:');
  optionalEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Configurada`);
    } else {
      console.log(`⚠️  ${varName}: No configurada (opcional)`);
    }
  });
  
  // 3. Verificar que exista al menos un superadmin
  try {
    const superAdminCount = await prisma.user.count({
      where: { role: 'SUPER_ADMIN' }
    });
    
    if (superAdminCount > 0) {
      console.log(`\n✅ Superadmin: ${superAdminCount} usuario(s) encontrado(s)`);
    } else {
      console.log('\n⚠️  Superadmin: No hay usuarios SUPER_ADMIN');
      console.log('   Ejecutá: node setup-superadmin.js');
    }
  } catch (error) {
    console.error('\n❌ Error verificando superadmin:', error.message);
    allGood = false;
  }
  
  // 4. Verificar estadísticas de la base de datos
  try {
    const [tenants, users, products, sales] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.product.count(),
      prisma.sale.count()
    ]);
    
    console.log('\n📊 Estadísticas de la base de datos:');
    console.log(`   Tenants: ${tenants}`);
    console.log(`   Usuarios: ${users}`);
    console.log(`   Productos: ${products}`);
    console.log(`   Ventas: ${sales}`);
  } catch (error) {
    console.error('\n❌ Error obteniendo estadísticas:', error.message);
    allGood = false;
  }
  
  // 5. Verificar espacio en disco (solo en producción)
  if (process.env.NODE_ENV === 'production') {
    console.log('\n💾 Espacio en disco:');
    console.log('   (Verificar manualmente en el servidor)');
  }
  
  // Resumen final
  console.log('\n' + '='.repeat(50));
  if (allGood) {
    console.log('✅ Sistema saludable - Todo OK');
  } else {
    console.log('⚠️  Sistema con problemas - Revisar errores arriba');
  }
  console.log('='.repeat(50) + '\n');
  
  await prisma.$disconnect();
  process.exit(allGood ? 0 : 1);
}

healthCheck().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
