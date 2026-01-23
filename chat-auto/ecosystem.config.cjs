/**
 * PM2 Ecosystem Config - Multi-Tenant WhatsApp Bots
 * 
 * Este archivo define los procesos de cada tenant.
 * Cada tenant tiene su propio proceso del bot con su puerto único.
 * 
 * Para agregar un nuevo tenant:
 * 1. Ejecutar: node ../server/create-tenant.js
 * 2. Ejecutar: node add-tenant-to-pm2.js <tenantId> <tenantName> <port>
 * 3. PM2 recargará automáticamente
 * 
 * Comandos útiles:
 * - pm2 start ecosystem.config.js    # Iniciar todos los bots
 * - pm2 restart all                  # Reiniciar todos
 * - pm2 logs                         # Ver logs de todos
 * - pm2 logs bot-tenant-1            # Ver logs de un bot específico
 * - pm2 stop all                     # Detener todos
 * - pm2 delete all                   # Eliminar todos
 */

module.exports = {
  apps: [
    {
      name: 'bot-9e7be69c',
      script: 'src/index.js',
      env: {
        TENANT_ID: '9e7be69c-a4de-4eb8-a7f9-131a390a8e7b',
        TENANT_NAME: 'Mundo Apple Test',
        BOT_API_PORT: 3001,
        USE_BACKEND: 'true',
        BACKEND_URL: 'http://localhost:8002/api',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'your-api-key-here',
        ANTHROPIC_MODEL: 'claude-3-5-sonnet-20241022',
        NODE_ENV: 'development',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      error_file: './logs/bot-9e7be69c-error.log',
      out_file: './logs/bot-9e7be69c-out.log',
      time: true,
    },
    
    // Los tenants se agregarán automáticamente con el script add-tenant-to-pm2.js
  ]
};
