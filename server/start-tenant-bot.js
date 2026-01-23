/**
 * Script para iniciar el bot de un tenant
 * 
 * Este script:
 * 1. Verifica que el tenant existe
 * 2. Asigna un puerto disponible si no tiene
 * 3. Agrega el tenant al ecosystem.config.js de PM2
 * 4. Inicia el proceso del bot
 * 
 * Uso: node start-tenant-bot.js <tenantId>
 */

const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const prisma = new PrismaClient();

async function startTenantBot(tenantId) {
  try {
    console.log(`\n🤖 Iniciando bot para tenant: ${tenantId}\n`);

    // 1. Buscar el tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      console.error(`❌ Tenant ${tenantId} no encontrado`);
      process.exit(1);
    }

    console.log(`✅ Tenant encontrado: ${tenant.name}`);

    // 2. Asignar puerto si no tiene
    let port = tenant.botPort;
    
    if (!port) {
      // Buscar el puerto más alto usado + 1
      const tenants = await prisma.tenant.findMany({
        where: { botPort: { not: null } },
        orderBy: { botPort: 'desc' },
        take: 1
      });

      port = tenants.length > 0 ? tenants[0].botPort + 1 : 3001;

      // Actualizar tenant con el puerto
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { botPort: port }
      });

      console.log(`✅ Puerto asignado: ${port}`);
    } else {
      console.log(`✅ Puerto existente: ${port}`);
    }

    // 3. Agregar al ecosystem de PM2
    console.log('\n📝 Agregando al ecosystem de PM2...');
    
    const addCommand = `node ../chat-auto/add-tenant-to-pm2.js "${tenantId}" "${tenant.name}" ${port}`;
    
    try {
      const { stdout, stderr } = await execPromise(addCommand);
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error) {
      // Si falla, puede ser porque ya existe
      if (error.message.includes('ya existe')) {
        console.log('⚠️ El tenant ya existe en PM2, continuando...');
      } else {
        throw error;
      }
    }

    // 4. Iniciar con PM2
    console.log('\n🚀 Iniciando proceso con PM2...');
    
    const appName = `bot-${tenantId.substring(0, 8)}`;
    const startCommand = `cd ../chat-auto && pm2 start ecosystem.config.js --only ${appName}`;
    
    const { stdout: startOut, stderr: startErr } = await execPromise(startCommand);
    console.log(startOut);
    if (startErr) console.error(startErr);

    // 5. Guardar configuración de PM2
    console.log('\n💾 Guardando configuración de PM2...');
    await execPromise('cd ../chat-auto && pm2 save');

    console.log('\n✅ Bot iniciado correctamente!');
    console.log(`   Nombre: ${appName}`);
    console.log(`   Puerto: ${port}`);
    console.log(`   Tenant: ${tenant.name}`);
    console.log('');
    console.log('📝 Comandos útiles:');
    console.log(`   Ver logs:     pm2 logs ${appName}`);
    console.log(`   Reiniciar:    pm2 restart ${appName}`);
    console.log(`   Detener:      pm2 stop ${appName}`);
    console.log(`   Ver estado:   pm2 status`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Leer tenantId de argumentos
const tenantId = process.argv[2];

if (!tenantId) {
  console.error('❌ Uso: node start-tenant-bot.js <tenantId>');
  process.exit(1);
}

startTenantBot(tenantId);
