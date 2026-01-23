/**
 * Script para configurar el sistema desde cero
 * 
 * EJECUTAR: node setup-superadmin.js
 * 
 * Este script:
 * 1. Limpia TODA la base de datos
 * 2. Crea un usuario SUPER_ADMIN
 * 
 * IMPORTANTE: Solo ejecutar UNA VEZ al inicio
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ========== CONFIGURACIÓN ==========
// Cambiá estos datos por los tuyos
const SUPER_ADMIN = {
  email: 'sistema@mundoiaple.com',
  password: 'mundoiaplezonasur',
  name: 'Dueño sistema'
};
// ===================================

async function main() {
  console.log('🚀 Iniciando configuración del sistema...\n');

  // Como la base está vacía, solo creamos el tenant y usuario
  
  // 1. Crear tenant especial para SUPER_ADMIN
  console.log('🏢 Creando tenant del sistema...');
  const systemTenant = await prisma.tenant.create({
    data: {
      name: 'Sistema',
      slug: 'sistema',
      onboardingCompleted: true,
      active: true
    }
  });
  console.log(`✅ Tenant creado: ${systemTenant.name}\n`);

  // 1.5 Crear sucursal por defecto
  console.log('🏪 Creando sucursal por defecto...');
  const store = await prisma.store.create({
    data: {
      name: 'Sucursal Principal',
      tenantId: systemTenant.id,
    }
  });
  console.log(`✅ Sucursal creada: ${store.name}\n`);

  // 2. Crear usuario SUPER_ADMIN
  console.log('👤 Creando usuario SUPER_ADMIN...');
  const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 10);
  
  const superAdmin = await prisma.user.create({
    data: {
      email: SUPER_ADMIN.email,
      password: hashedPassword,
      name: SUPER_ADMIN.name,
      role: 'SUPER_ADMIN',
      tenantId: systemTenant.id,
      storeId: store.id,
      active: true
    }
  });
  console.log(`✅ SUPER_ADMIN creado: ${superAdmin.email}\n`);

  // Resumen
  console.log('═══════════════════════════════════════════');
  console.log('🎉 ¡SISTEMA CONFIGURADO CORRECTAMENTE!');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('📧 Email:    ', SUPER_ADMIN.email);
  console.log('🔑 Password: ', SUPER_ADMIN.password);
  console.log('');
  console.log('PRÓXIMOS PASOS:');
  console.log('1. Iniciá el servidor: npm run dev');
  console.log('2. Entrá al sistema con las credenciales de arriba');
  console.log('3. Andá a "Administración" para crear negocios');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
