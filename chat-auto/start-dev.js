/**
 * Script para iniciar el bot en modo desarrollo
 * Levanta un bot en el puerto 8003 para el tenant por defecto
 */

import dotenv from 'dotenv';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env
dotenv.config({ path: path.join(__dirname, '.env') });

// Configuración del bot para desarrollo
const env = {
  ...process.env,
  TENANT_ID: process.env.TENANT_ID || 'default',
  TENANT_NAME: process.env.TENANT_NAME || 'Desarrollo',
  BOT_API_PORT: '8003',
  USE_BACKEND: 'true',
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8002',
  NODE_ENV: 'development',
};

console.log('🤖 Iniciando bot en modo desarrollo...');
console.log(`   Tenant: ${env.TENANT_NAME} (${env.TENANT_ID})`);
console.log(`   Puerto: ${env.BOT_API_PORT}`);
console.log(`   Backend: ${env.BACKEND_URL}`);
console.log('');

// Iniciar el bot
const bot = spawn('node', ['src/index.js'], {
  cwd: __dirname,
  env,
  stdio: 'inherit',
  shell: true
});

bot.on('error', (error) => {
  console.error('❌ Error iniciando el bot:', error);
  process.exit(1);
});

bot.on('exit', (code) => {
  console.log(`\n🛑 Bot detenido con código ${code}`);
  process.exit(code || 0);
});

// Manejar señales de terminación
process.on('SIGINT', () => {
  console.log('\n🛑 Deteniendo bot...');
  bot.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Deteniendo bot...');
  bot.kill('SIGTERM');
});
