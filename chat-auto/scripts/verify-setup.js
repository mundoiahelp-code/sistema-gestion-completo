import { existsSync, readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Verificando configuración del proyecto...\n');

let errors = 0;
let warnings = 0;

// 1. Verificar Node.js version
console.log('1. Verificando versión de Node.js...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
if (majorVersion >= 18) {
  console.log(`   ✅ Node.js ${nodeVersion} (OK)\n`);
} else {
  console.log(`   ❌ Node.js ${nodeVersion} (Se requiere >= 18.0.0)\n`);
  errors++;
}

// 2. Verificar .env
console.log('2. Verificando archivo .env...');
if (existsSync('.env')) {
  console.log('   ✅ Archivo .env existe');
  
  // Verificar variables requeridas
  const requiredVars = [
    'ANTHROPIC_API_KEY',
    'GOOGLE_SHEETS_ID',
    'BOT_NAME',
    'BUSINESS_NAME'
  ];
  
  let missingVars = [];
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length === 0) {
    console.log('   ✅ Todas las variables requeridas están configuradas\n');
  } else {
    console.log(`   ❌ Faltan variables: ${missingVars.join(', ')}\n`);
    errors++;
  }
} else {
  console.log('   ❌ Archivo .env no existe');
  console.log('   💡 Ejecuta: cp .env.example .env\n');
  errors++;
}

// 3. Verificar google-credentials.json
console.log('3. Verificando credenciales de Google...');
if (existsSync('google-credentials.json')) {
  try {
    const credentials = JSON.parse(readFileSync('google-credentials.json', 'utf8'));
    if (credentials.type === 'service_account') {
      console.log('   ✅ Credenciales de Google válidas\n');
    } else {
      console.log('   ⚠️  El archivo existe pero no parece ser un Service Account\n');
      warnings++;
    }
  } catch (error) {
    console.log('   ❌ Error al leer credenciales de Google\n');
    errors++;
  }
} else {
  console.log('   ❌ Archivo google-credentials.json no existe');
  console.log('   💡 Descarga las credenciales de Google Cloud Console\n');
  errors++;
}

// 4. Verificar node_modules
console.log('4. Verificando dependencias...');
if (existsSync('node_modules')) {
  console.log('   ✅ Dependencias instaladas\n');
} else {
  console.log('   ❌ Dependencias no instaladas');
  console.log('   💡 Ejecuta: npm install\n');
  errors++;
}

// 5. Verificar estructura de carpetas
console.log('5. Verificando estructura del proyecto...');
const requiredDirs = [
  'src',
  'src/ai',
  'src/config',
  'src/services',
  'src/sheets',
  'src/whatsapp',
  'src/setup',
  'docs',
  'tests'
];

let missingDirs = [];
requiredDirs.forEach(dir => {
  if (!existsSync(dir)) {
    missingDirs.push(dir);
  }
});

if (missingDirs.length === 0) {
  console.log('   ✅ Estructura del proyecto correcta\n');
} else {
  console.log(`   ⚠️  Faltan carpetas: ${missingDirs.join(', ')}\n`);
  warnings++;
}

// 6. Verificar archivos principales
console.log('6. Verificando archivos principales...');
const requiredFiles = [
  'src/index.js',
  'src/config/config.js',
  'src/ai/anthropic.js',
  'src/whatsapp/client.js',
  'package.json'
];

let missingFiles = [];
requiredFiles.forEach(file => {
  if (!existsSync(file)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length === 0) {
  console.log('   ✅ Todos los archivos principales existen\n');
} else {
  console.log(`   ❌ Faltan archivos: ${missingFiles.join(', ')}\n`);
  errors++;
}

// 7. Verificar API keys
console.log('7. Verificando API keys...');
if (process.env.ANTHROPIC_API_KEY) {
  if (process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
    console.log('   ✅ Anthropic API key tiene formato correcto\n');
  } else {
    console.log('   ⚠️  Anthropic API key no tiene el formato esperado\n');
    warnings++;
  }
} else {
  console.log('   ❌ Anthropic API key no configurada\n');
  errors++;
}

// Resumen
console.log('═══════════════════════════════════════════════════════');
console.log('RESUMEN DE VERIFICACIÓN\n');

if (errors === 0 && warnings === 0) {
  console.log('✅ ¡Todo está configurado correctamente!');
  console.log('\n📝 Próximos pasos:');
  console.log('   1. Ejecuta: npm run setup (para crear hojas en Google Sheets)');
  console.log('   2. Ejecuta: npm start (para iniciar el bot)');
  console.log('   3. Escanea el QR con WhatsApp');
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} error(es) encontrado(s)`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} advertencia(s) encontrada(s)`);
  }
  console.log('\n💡 Revisa los mensajes arriba para corregir los problemas.');
}

console.log('═══════════════════════════════════════════════════════\n');

process.exit(errors > 0 ? 1 : 0);
