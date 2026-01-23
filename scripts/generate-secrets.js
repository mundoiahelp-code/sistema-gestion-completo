#!/usr/bin/env node

/**
 * Script para Generar Secretos Seguros
 * Genera JWT_SECRET y otros secretos aleatorios
 */

const crypto = require('crypto');

console.log('🔐 Generador de Secretos Seguros\n');
console.log('='.repeat(50));

// Generar JWT_SECRET (64 bytes = 128 caracteres hex)
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('\n📝 JWT_SECRET (128 caracteres):');
console.log(jwtSecret);

// Generar token de webhook (32 bytes = 64 caracteres hex)
const webhookToken = crypto.randomBytes(32).toString('hex');
console.log('\n📝 WEBHOOK_TOKEN (64 caracteres):');
console.log(webhookToken);

// Generar API key personalizada (formato similar a Anthropic)
const apiKey = 'sk-custom-' + crypto.randomBytes(32).toString('base64').replace(/[+/=]/g, '');
console.log('\n📝 CUSTOM_API_KEY:');
console.log(apiKey);

console.log('\n' + '='.repeat(50));
console.log('\n💡 Cómo usar:');
console.log('1. Copia el JWT_SECRET generado');
console.log('2. Pégalo en server/.env reemplazando el valor actual');
console.log('3. Reinicia el servidor para aplicar cambios');
console.log('\n⚠️  NUNCA compartas estos secretos ni los commitees a git\n');
