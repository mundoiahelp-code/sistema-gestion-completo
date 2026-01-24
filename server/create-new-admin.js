/**
 * Script para crear un nuevo usuario SUPER_ADMIN
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const NEW_ADMIN = {
  email: 'mundoia.help@gmail.com',
  password: 'Lauti10b12RR!!',
  name: 'Lauti - Super Admin'
};

async function main() {
  console.log('🚀 Creando nuevo usuario SUPER_ADMIN...\n');

  // Buscar el tenant del sistema
  const systemTenant = await prisma.tenant.findFirst({
    where: { slug: 'sistema' }
  });

  if (!systemTenant) {
    throw new Error('No se encontró el tenant del sistema');
  }

  // Buscar la sucursal
  const store = await prisma.store.findFirst({
    where: { tenantId: systemTenant.id }
  });

  if (!store) {
    throw new Error('No se encontró la sucursal');
  }

  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email: NEW_ADMIN.email }
  });

  if (existingUser) {
    console.log('⚠️  El usuario ya existe. Actualizando...');
    const hashedPassword = await bcrypt.hash(NEW_ADMIN.password, 10);
    
    const updatedUser = await prisma.user.update({
      where: { email: NEW_ADMIN.email },
      data: {
        password: hashedPassword,
        name: NEW_ADMIN.name,
        role: 'SUPER_ADMIN',
        active: true
      }
    });
    
    console.log(`✅ Usuario actualizado: ${updatedUser.email}\n`);
  } else {
    console.log('👤 Creando nuevo usuario...');
    const hashedPassword = await bcrypt.hash(NEW_ADMIN.password, 10);
    
    const newAdmin = await prisma.user.create({
      data: {
        email: NEW_ADMIN.email,
        password: hashedPassword,
        name: NEW_ADMIN.name,
        role: 'SUPER_ADMIN',
        tenantId: systemTenant.id,
        storeId: store.id,
        active: true
      }
    });
    
    console.log(`✅ Usuario creado: ${newAdmin.email}\n`);
  }

  console.log('═══════════════════════════════════════════');
  console.log('🎉 ¡USUARIO CONFIGURADO!');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('📧 Email:    ', NEW_ADMIN.email);
  console.log('🔑 Password: ', NEW_ADMIN.password);
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
