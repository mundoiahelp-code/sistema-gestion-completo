#!/usr/bin/env node

/**
 * Script de Validación de Seguridad
 * Verifica que no haya claves sensibles expuestas
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Validando seguridad del proyecto...\n');

let hasErrors = false;
let hasWarnings = false;

// 1. Verificar que archivos .env NO estén en git
console.log('1️⃣ Verificando archivos .env...');
const envFiles = [
  'server/.env',
  'landing/.env',
  'sistema/.env',
  'chat-auto/.env'
];

envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ⚠️  ${file} existe (asegúrate que esté en .gitignore)`);
    hasWarnings = true;
  }
});

// 2. Verificar que existan archivos .env.example
console.log('\n2️⃣ Verificando archivos .env.example...');
const exampleFiles = [
  'server/.env.example',
  'landing/.env.example',
  'sistema/.env.example',
  'chat-auto/.env.example'
];

exampleFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} NO EXISTE`);
    hasErrors = true;
  }
});

// 3. Verificar JWT_SECRET
console.log('\n3️⃣ Verificando JWT_SECRET...');
if (fs.existsSync('server/.env')) {
  const envContent = fs.readFileSync('server/.env', 'utf8');
  const jwtMatch = envContent.match(/JWT_SECRET="?([^"\n]+)"?/);
  
  if (jwtMatch) {
    const secret = jwtMatch[1];
    if (secret.length < 32) {
      console.log(`   ❌ JWT_SECRET muy corto (${secret.length} caracteres, mínimo 32)`);
      hasErrors = true;
    } else if (secret.includes('desarrollo') || secret.includes('cambiar') || secret.includes('ejemplo')) {
      console.log(`   ⚠️  JWT_SECRET parece ser de ejemplo, cámbialo por uno aleatorio`);
      hasWarnings = true;
    } else {
      console.log(`   ✅ JWT_SECRET tiene longitud adecuada (${secret.length} caracteres)`);
    }
  } else {
    console.log('   ❌ JWT_SECRET no encontrado');
    hasErrors = true;
  }
}

// 4. Verificar ANTHROPIC_API_KEY
console.log('\n4️⃣ Verificando ANTHROPIC_API_KEY...');
const anthropicFiles = ['server/.env', 'chat-auto/.env'];
anthropicFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const envContent = fs.readFileSync(file, 'utf8');
    const apiKeyMatch = envContent.match(/ANTHROPIC_API_KEY=([^\n]+)/);
    
    if (apiKeyMatch) {
      const key = apiKeyMatch[1].trim();
      if (key.startsWith('sk-ant-api03-')) {
        if (key.includes('XXXX') || key.includes('tu-api-key')) {
          console.log(`   ⚠️  ${file}: API key es de ejemplo`);
          hasWarnings = true;
        } else {
          console.log(`   ✅ ${file}: API key configurada`);
        }
      } else {
        console.log(`   ❌ ${file}: API key con formato inválido`);
        hasErrors = true;
      }
    } else {
      console.log(`   ⚠️  ${file}: ANTHROPIC_API_KEY no encontrada`);
      hasWarnings = true;
    }
  }
});

// 5. Verificar .gitignore
console.log('\n5️⃣ Verificando .gitignore...');
const gitignoreFiles = [
  '.gitignore',
  'server/.gitignore',
  'landing/.gitignore',
  'sistema/.gitignore',
  'chat-auto/.gitignore'
];

gitignoreFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('.env')) {
      console.log(`   ✅ ${file} protege archivos .env`);
    } else {
      console.log(`   ❌ ${file} NO protege archivos .env`);
      hasErrors = true;
    }
  } else {
    console.log(`   ⚠️  ${file} no existe`);
    hasWarnings = true;
  }
});

// 6. Buscar claves hardcodeadas en código
console.log('\n6️⃣ Buscando claves hardcodeadas...');
const dangerousPatterns = [
  { pattern: /sk-ant-api03-[A-Za-z0-9]{100,}/, name: 'Anthropic API Key' },
  { pattern: /JWT_SECRET\s*=\s*["'](?!.*process\.env)[^"']{10,}["']/, name: 'JWT Secret hardcodeado' }
];

function scanDirectory(dir, patterns) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    // Ignorar node_modules, .git, dist, etc
    if (file.name === 'node_modules' || file.name === '.git' || 
        file.name === 'dist' || file.name === '.next' || 
        file.name === 'build' || file.name.startsWith('.env')) {
      return;
    }
    
    if (file.isDirectory()) {
      scanDirectory(fullPath, patterns);
    } else if (file.name.match(/\.(js|ts|jsx|tsx)$/)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      patterns.forEach(({ pattern, name }) => {
        if (pattern.test(content)) {
          console.log(`   ⚠️  Posible ${name} en: ${fullPath}`);
          hasWarnings = true;
        }
      });
    }
  });
}

try {
  ['server/src', 'sistema/src', 'landing/src', 'chat-auto/src'].forEach(dir => {
    if (fs.existsSync(dir)) {
      scanDirectory(dir, dangerousPatterns);
    }
  });
  console.log('   ✅ Escaneo completado');
} catch (error) {
  console.log(`   ⚠️  Error escaneando: ${error.message}`);
}

// Resumen
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ ERRORES CRÍTICOS ENCONTRADOS');
  console.log('   Por favor, corrige los errores antes de continuar');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  ADVERTENCIAS ENCONTRADAS');
  console.log('   Revisa las advertencias para mejorar la seguridad');
  process.exit(0);
} else {
  console.log('✅ VALIDACIÓN EXITOSA');
  console.log('   No se encontraron problemas de seguridad');
  process.exit(0);
}
