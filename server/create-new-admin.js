/**
 * Script para crear/actualizar usuario super admin
 * Uso: node create-new-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ADMIN = {
  email: 'mundoia.help@gmail.com',
  password: 'Lauti10b12RR!!',
  name: 'Super Admin'
};

async function main() {
  console.log('🔧 Creando/actualizando usuario super admin...\n');

  // Buscar tenant y tienda
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    throw new Error('❌ No hay tenants en la base de datos. Ejecutar init-production-db.js primero');
  }

  const store = await prisma.store.findFirst({ where: { tenantId: tenant.id } });
  if (!store) {
    throw new Error('❌ No hay tiendas en la base de datos. Ejecutar init-production-db.js primero');
  }

  // Crear o actualizar usuario
  const hashedPassword = await bcrypt.hash(ADMIN.password, 10);
  const user = await prisma.user.upsert({
    where: { email: ADMIN.email },
    update: {
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      active: true
    },
    create: {
      email: ADMIN.email,
      password: hashedPassword,
      name: ADMIN.name,
      role: 'SUPER_ADMIN',
      tenantId: tenant.id,
      storeId: store.id,
      active: true
    }
  });

  console.log('✅ Usuario configurado correctamente\n');
  console.log('═══════════════════════════════════════════');
  console.log('📧 Email:    ', ADMIN.email);
  console.log('🔑 Password: ', ADMIN.password);
  console.log('═══════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
