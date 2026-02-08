/**
 * Script para crear/actualizar usuario super admin
 * Uso: node create-new-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const ADMIN = {
  email: 'contacto@clodeb.com',
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
  
  // Verificar si el usuario existe
  const existingUser = await prisma.user.findUnique({
    where: { email: ADMIN.email },
    select: { id: true, email: true }
  });

  let user;
  if (existingUser) {
    user = await prisma.user.update({
      where: { email: ADMIN.email },
      data: {
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        active: true
      }
    });
  } else {
    user = await prisma.user.create({
      data: {
        email: ADMIN.email,
        password: hashedPassword,
        name: ADMIN.name,
        role: 'SUPER_ADMIN',
        tenantId: tenant.id,
        storeId: store.id,
        active: true
      }
    });
  }

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
