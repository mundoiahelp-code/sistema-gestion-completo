/**
 * Script para agregar un nuevo tenant al ecosystem de PM2
 * 
 * Uso: node add-tenant-to-pm2.js <tenantId> <tenantName> <port>
 * Ejemplo: node add-tenant-to-pm2.js abc-123 "Mundo Apple" 3001
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer argumentos
const [,, tenantId, tenantName, port] = process.argv;

if (!tenantId || !tenantName || !port) {
  console.error('❌ Uso: node add-tenant-to-pm2.js <tenantId> <tenantName> <port>');
  console.error('   Ejemplo: node add-tenant-to-pm2.js abc-123 "Mundo Apple" 3001');
  process.exit(1);
}

// Validar puerto
const portNum = parseInt(port);
if (isNaN(portNum) || portNum < 3000 || portNum > 9999) {
  console.error('❌ El puerto debe ser un número entre 3000 y 9999');
  process.exit(1);
}

// Leer .env para obtener las variables necesarias
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ No se encontró el archivo .env');
  console.error('   Copiá .env.example a .env y configuralo primero');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

// Leer ecosystem.config.js actual
const ecosystemPath = path.join(__dirname, 'ecosystem.config.js');
let ecosystemContent = fs.readFileSync(ecosystemPath, 'utf8');

// Crear configuración del nuevo tenant
const appName = `bot-${tenantId.substring(0, 8)}`;
const newApp = `    {
      name: '${appName}',
      script: 'src/index.js',
      env: {
        TENANT_ID: '${tenantId}',
        TENANT_NAME: '${tenantName}',
        BOT_API_PORT: ${portNum},
        USE_BACKEND: '${envVars.USE_BACKEND || 'true'}',
        BACKEND_URL: '${envVars.BACKEND_URL || 'http://localhost:8000'}',
        ANTHROPIC_API_KEY: '${envVars.ANTHROPIC_API_KEY || ''}',
        ANTHROPIC_MODEL: '${envVars.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'}',
        NODE_ENV: '${envVars.NODE_ENV || 'production'}',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      error_file: './logs/${appName}-error.log',
      out_file: './logs/${appName}-out.log',
      time: true,
    },`;

// Verificar si el tenant ya existe
if (ecosystemContent.includes(`TENANT_ID: '${tenantId}'`)) {
  console.error(`❌ El tenant ${tenantId} ya existe en ecosystem.config.js`);
  process.exit(1);
}

// Verificar si el puerto ya está en uso
if (ecosystemContent.includes(`BOT_API_PORT: ${portNum}`)) {
  console.error(`❌ El puerto ${portNum} ya está en uso por otro tenant`);
  process.exit(1);
}

// Agregar el nuevo app al array
// Buscar el array de apps y agregar antes del cierre
const appsArrayMatch = ecosystemContent.match(/apps:\s*\[([\s\S]*?)\]/);
if (!appsArrayMatch) {
  console.error('❌ No se pudo encontrar el array de apps en ecosystem.config.js');
  process.exit(1);
}

// Insertar el nuevo app
const beforeClosing = ecosystemContent.lastIndexOf(']');
const beforeContent = ecosystemContent.substring(0, beforeClosing);
const afterContent = ecosystemContent.substring(beforeClosing);

// Si ya hay apps, agregar coma
let separator = '';
const existingApps = appsArrayMatch[1].trim();
if (existingApps && !existingApps.endsWith(',')) {
  separator = ',\n';
}

const newContent = beforeContent + separator + '\n' + newApp + '\n  ' + afterContent;

// Guardar
fs.writeFileSync(ecosystemPath, newContent);

console.log('✅ Tenant agregado a ecosystem.config.js');
console.log(`   Nombre: ${appName}`);
console.log(`   Tenant: ${tenantName} (${tenantId})`);
console.log(`   Puerto: ${portNum}`);
console.log('');
console.log('📝 Próximos pasos:');
console.log('   1. Actualizar el tenant en la base de datos con el puerto:');
console.log(`      UPDATE tenants SET botPort = ${portNum} WHERE id = '${tenantId}';`);
console.log('');
console.log('   2. Iniciar el bot con PM2:');
console.log(`      pm2 start ecosystem.config.js --only ${appName}`);
console.log('');
console.log('   3. Ver logs:');
console.log(`      pm2 logs ${appName}`);
console.log('');
console.log('   4. Guardar configuración de PM2:');
console.log('      pm2 save');
console.log('');
