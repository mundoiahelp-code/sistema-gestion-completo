import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear tenant (empresa) de ejemplo
  const tenant = await prisma.tenant.create({
    data: {
      name: 'iPhone Zone Sur',
      slug: 'iphonezonesur',
      logo: null,
      primaryColor: '#000000',
      secondaryColor: '#ffffff',
      phone: '+54 9 11 1234-5678',
      email: 'contacto@Clodeb.com',
      address: 'Av. Principal 123, Buenos Aires',
      instagram: '@Clodeb',
      whatsapp: '+5491112345678',
      currency: 'ARS',
      plan: 'premium',
      planExpires: new Date('2025-12-31'),
    }
  });
  console.log('✅ Empresa creada:', tenant.name);

  // Crear tienda principal
  const store = await prisma.store.create({
    data: {
      name: 'Sucursal Principal',
      address: 'Av. Principal 123',
      phone: '+54 11 1234-5678',
      tenantId: tenant.id
    }
  });
  console.log('✅ Tienda creada');

  // Crear usuarios
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@sistema.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
      tenantId: tenant.id,
      storeId: store.id
    }
  });

  const sellerPassword = await bcrypt.hash('seller123', 10);
  const seller = await prisma.user.create({
    data: {
      email: 'vendedor@sistema.com',
      password: sellerPassword,
      name: 'Vendedor',
      role: 'SELLER',
      tenantId: tenant.id,
      storeId: store.id
    }
  });
  console.log('✅ Usuarios creados');

  // Crear productos de ejemplo (iPhones)
  await prisma.product.createMany({
    data: [
      {
        name: 'iPhone 15 Pro Max',
        model: 'iPhone 15 Pro Max',
        storage: '256GB',
        color: 'Titanio Natural',
        imei: '353271500000001',
        battery: 100,
        price: 2500000,
        cost: 2000000,
        stock: 1,
        condition: 'Nuevo',
        category: 'PHONE',
        warrantyDays: 365,
        tenantId: tenant.id,
        storeId: store.id
      },
      {
        name: 'iPhone 14 Pro',
        model: 'iPhone 14 Pro',
        storage: '128GB',
        color: 'Negro Espacial',
        imei: '353901400000002',
        battery: 95,
        price: 1800000,
        cost: 1400000,
        stock: 1,
        condition: 'Usado',
        category: 'PHONE',
        warrantyDays: 90,
        tenantId: tenant.id,
        storeId: store.id
      },
      {
        name: 'AirPods Pro 2',
        model: '2da GEN',
        price: 350000,
        cost: 250000,
        stock: 5,
        condition: 'Nuevo',
        category: 'ACCESSORY',
        tenantId: tenant.id,
        storeId: store.id
      },
      {
        name: 'Cargador MagSafe',
        model: 'Original Apple',
        price: 80000,
        cost: 50000,
        stock: 10,
        condition: 'Nuevo',
        category: 'ACCESSORY',
        tenantId: tenant.id,
        storeId: store.id
      }
    ]
  });
  console.log('✅ Productos creados');

  // Crear clientes de ejemplo
  await prisma.client.createMany({
    data: [
      {
        name: 'Nicolas Percio',
        email: 'nicodelpercio@gmail.com',
        phone: '+54 11 2222-3333',
        dni: '12345678',
        tenantId: tenant.id
      },
      {
        name: 'María González',
        email: 'maria@email.com',
        phone: '+54 11 4444-5555',
        dni: '87654321',
        tenantId: tenant.id
      }
    ]
  });
  console.log('✅ Clientes creados');

  console.log('\n🎉 Seed completado!\n');
  console.log('📝 Datos de acceso:');
  console.log('   Empresa: ' + tenant.name + ' (slug: ' + tenant.slug + ')');
  console.log('   Admin:    admin@sistema.com / admin123');
  console.log('   Vendedor: vendedor@sistema.com / seller123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
