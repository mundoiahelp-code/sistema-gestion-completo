const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Sembrando base de datos...');

    // Crear tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Mundo Apple',
        slug: 'mundoiaple',
        phone: '+5491112345678',
        email: 'info@iphonezonasur.com',
        address: 'Buenos Aires, Argentina'
      }
    });
    console.log('✅ Tenant creado:', tenant.name);

    // Crear tienda
    const store = await prisma.store.create({
      data: {
        name: 'Tienda Principal',
        address: 'Av. Corrientes 1234',
        phone: '+5491112345678',
        tenantId: tenant.id
      }
    });
    console.log('✅ Tienda creada:', store.name);

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@iphonezonasur.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
        tenantId: tenant.id,
        storeId: store.id
      }
    });
    console.log('✅ Usuario admin creado:', admin.email);
    console.log('   Password: admin123');

    // Crear algunos productos de ejemplo
    const products = [
      {
        name: 'iPhone 13 Pro',
        model: 'iPhone 13 Pro',
        storage: '128GB',
        color: 'Plata',
        battery: 95,
        price: 850000,
        cost: 700000,
        stock: 2,
        condition: 'Impecable',
        category: 'PHONE',
        tenantId: tenant.id,
        storeId: store.id
      },
      {
        name: 'iPhone 14',
        model: 'iPhone 14',
        storage: '256GB',
        color: 'Negro',
        battery: 100,
        price: 1200000,
        cost: 1000000,
        stock: 1,
        condition: 'Nuevo',
        category: 'PHONE',
        tenantId: tenant.id,
        storeId: store.id
      },
      {
        name: 'iPhone 12',
        model: 'iPhone 12',
        storage: '64GB',
        color: 'Azul',
        battery: 88,
        price: 650000,
        cost: 550000,
        stock: 3,
        condition: 'Muy bueno',
        category: 'PHONE',
        tenantId: tenant.id,
        storeId: store.id
      }
    ];

    for (const product of products) {
      await prisma.product.create({ data: product });
    }
    console.log('✅ Productos creados: 3');

    console.log('\n🎉 Base de datos sembrada exitosamente!');
    console.log('\n📝 Credenciales de acceso:');
    console.log('   Email: admin@iphonezonasur.com');
    console.log('   Password: admin123');
    console.log('\n🌐 Accede en: http://localhost:3000');

  } catch (error) {
    console.error('❌ Error sembrando base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
