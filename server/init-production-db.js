/**
 * Script para inicializar la base de datos en producción
 * Ejecuta migraciones, crea el tenant del sistema, una tienda y el usuario super admin
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

const ADMIN_USER = {
  email: 'mundoia.help@gmail.com',
  password: 'Lauti10b12RR!!',
  name: 'Super Admin'
};

async function main() {
  console.log('🚀 Inicializando base de datos de producción...\n');

  // 0. Ejecutar migraciones
  console.log('0️⃣ Ejecutando migraciones de base de datos...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Migraciones aplicadas correctamente\n');
  } catch (error) {
    console.error('❌ Error al aplicar migraciones:', error.message);
    console.error('⚠️ Continuando con la inicialización...\n');
  }

  // 0.1 Aplicar fix de appointments si es necesario
  console.log('0️⃣.1 Verificando fix de appointments...');
  try {
    execSync('node fix-appointments-migration.js', { stdio: 'inherit' });
    console.log('✅ Fix de appointments verificado\n');
  } catch (error) {
    console.error('❌ Error aplicando fix:', error.message);
    console.error('⚠️ Continuando con la inicialización...\n');
  }

  // 1. Crear tenant del sistema
  console.log('1️⃣ Creando tenant del sistema...');
  let tenant = await prisma.tenant.findFirst({
    where: { slug: 'sistema' }
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Sistema Principal',
        slug: 'sistema',
        email: ADMIN_USER.email,
        active: true,
        onboardingCompleted: true,
        emailVerified: true
      }
    });
    console.log('✅ Tenant creado:', tenant.name);
  } else {
    console.log('✅ Tenant ya existe:', tenant.name);
  }

  // 2. Crear tienda principal
  console.log('\n2️⃣ Creando tienda principal...');
  let store = await prisma.store.findFirst({
    where: { tenantId: tenant.id }
  });

  if (!store) {
    store = await prisma.store.create({
      data: {
        name: 'Tienda Principal',
        icon: 'store',
        tenantId: tenant.id,
        active: true
      }
    });
    console.log('✅ Tienda creada:', store.name);
  } else {
    console.log('✅ Tienda ya existe:', store.name);
  }

  // 3. Crear usuario super admin
  console.log('\n3️⃣ Creando usuario super admin...');
  let user = await prisma.user.findUnique({
    where: { email: ADMIN_USER.email }
  });

  const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 10);

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: ADMIN_USER.email,
        password: hashedPassword,
        name: ADMIN_USER.name,
        role: 'SUPER_ADMIN',
        tenantId: tenant.id,
        storeId: store.id,
        active: true
      }
    });
    console.log('✅ Usuario creado:', user.email);
  } else {
    user = await prisma.user.update({
      where: { email: ADMIN_USER.email },
      data: {
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        active: true
      }
    });
    console.log('✅ Usuario actualizado:', user.email);
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('🎉 ¡BASE DE DATOS INICIALIZADA!');
  console.log('═══════════════════════════════════════════');
  console.log('\n📧 Email:    ', ADMIN_USER.email);
  console.log('🔑 Password: ', ADMIN_USER.password);
  console.log('\n✅ Ya puedes hacer login en tu sistema\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
