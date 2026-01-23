/**
 * Script para crear un nuevo tenant (cliente) en el sistema
 * 
 * Uso: node create-tenant.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createTenant() {
  try {
    console.log('\n🏢 === CREAR NUEVO CLIENTE (TENANT) ===\n');

    // Datos del negocio
    const businessName = await question('Nombre del negocio: ');
    const slug = await question('Slug (URL amigable, ej: "mitienda"): ');
    const phone = await question('Teléfono de WhatsApp (ej: 5491144224497): ');
    const email = await question('Email del negocio: ');
    
    // Datos del usuario admin
    console.log('\n👤 === DATOS DEL ADMINISTRADOR ===\n');
    const adminName = await question('Nombre del administrador: ');
    const adminEmail = await question('Email del administrador: ');
    const adminPassword = await question('Contraseña del administrador: ');

    // Plan
    console.log('\n💳 === PLAN Y SUSCRIPCIÓN ===\n');
    console.log('Planes disponibles: basic, pro, enterprise');
    const plan = await question('Plan (default: basic): ') || 'basic';
    const planPrice = await question('Precio mensual (ej: 5000): ');

    console.log('\n⏳ Creando tenant y usuario...\n');

    // Crear tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: businessName,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        phone: phone,
        email: email,
        whatsapp: phone,
        plan: plan,
        planPrice: planPrice ? parseFloat(planPrice) : null,
        planStartDate: new Date(),
        paymentStatus: 'pending',
        active: true,
        emailVerified: true, // Auto-verificado para simplificar
        onboardingCompleted: false,
      }
    });

    console.log(`✅ Tenant creado: ${tenant.name} (ID: ${tenant.id})`);

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'ADMIN',
        tenantId: tenant.id,
        active: true,
      }
    });

    console.log(`✅ Usuario admin creado: ${user.name} (${user.email})`);

    // Crear tienda por defecto
    const store = await prisma.store.create({
      data: {
        name: 'Tienda Principal',
        address: 'Por definir',
        tenantId: tenant.id,
      }
    });

    console.log(`✅ Tienda creada: ${store.name}`);

    console.log('\n🎉 === CLIENTE CREADO EXITOSAMENTE ===\n');
    console.log('Datos de acceso:');
    console.log(`  URL: http://localhost:3000`);
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Contraseña: ${adminPassword}`);
    console.log(`  Tenant ID: ${tenant.id}`);
    console.log('\n📝 Próximos pasos:');
    console.log('  1. El cliente debe iniciar sesión');
    console.log('  2. Configurar WhatsApp en Ajustes → Integraciones');
    console.log('  3. Escanear el código QR');
    console.log('  4. Configurar el bot en Ajustes → Chatbot');
    console.log('  5. Agregar productos en Celulares/Accesorios');
    console.log('');

    // Preguntar si quiere iniciar el bot ahora
    const startBot = await question('\n¿Querés iniciar el bot de WhatsApp ahora? (s/n): ');
    
    if (startBot.toLowerCase() === 's' || startBot.toLowerCase() === 'si') {
      console.log('\n🤖 Iniciando bot...');
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      try {
        const { stdout, stderr } = await execPromise(`node start-tenant-bot.js ${tenant.id}`);
        console.log(stdout);
        if (stderr) console.error(stderr);
      } catch (error) {
        console.error('❌ Error iniciando bot:', error.message);
        console.log('   Podés iniciarlo manualmente con:');
        console.log(`   node start-tenant-bot.js ${tenant.id}`);
      }
    } else {
      console.log('\n📝 Para iniciar el bot más tarde, ejecutá:');
      console.log(`   node start-tenant-bot.js ${tenant.id}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P2002') {
      console.error('   El slug o email ya existe. Usá uno diferente.');
    }
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createTenant();
