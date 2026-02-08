import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Anthropic
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4-20250514',
    maxTokens: 1024
  },

  // Google Sheets
  sheets: {
    spreadsheetId: process.env.GOOGLE_SHEETS_ID,
    credentialsPath: './google-credentials.json',
    sheetNames: {
      stock: 'Stock',
      sales: 'Ventas',
      appointments: 'Turnos',
      customers: 'Clientes',
      followups: 'Seguimientos'
    }
  },

  // Bot
  bot: {
    name: process.env.BOT_NAME || 'Lumi',
    businessName: process.env.BUSINESS_NAME || 'Tu Negocio',
    businessHours: {
      start: parseInt(process.env.BUSINESS_HOURS_START) || 9,
      end: parseInt(process.env.BUSINESS_HOURS_END) || 21
    }
  },

  // Seguimiento
  followup: {
    enabled: process.env.ENABLE_AUTO_FOLLOWUP === 'true',
    delayHours: parseInt(process.env.FOLLOWUP_DELAY_HOURS) || 24
  },

  // Cache
  cache: {
    ttl: 3600, // 1 hora
    checkperiod: 600 // 10 minutos
  },

  // Backend API
  backend: {
    url: process.env.BACKEND_URL || 'http://localhost:8001/api',
    token: process.env.BACKEND_TOKEN || ''
  },

  // MercadoPago
  mercadoPago: {
    accessToken: process.env.MP_ACCESS_TOKEN || '',
    publicKey: process.env.MP_PUBLIC_KEY || '',
    alias: process.env.MP_ALIAS || '',
    cvu: process.env.MP_CVU || '',
    titular: process.env.MP_TITULAR || '',
    successUrl: process.env.MP_SUCCESS_URL || '',
    failureUrl: process.env.MP_FAILURE_URL || '',
    pendingUrl: process.env.MP_PENDING_URL || '',
    webhookUrl: process.env.MP_WEBHOOK_URL || ''
  }
};
