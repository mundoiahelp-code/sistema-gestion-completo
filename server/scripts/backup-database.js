/**
 * Script para hacer backup de la base de datos PostgreSQL
 * 
 * Uso:
 * node scripts/backup-database.js
 * 
 * Requisitos:
 * - pg_dump instalado (viene con PostgreSQL)
 * - Variables de entorno configuradas en .env
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Crear carpeta de backups si no existe
const BACKUP_DIR = path.join(__dirname, '../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Nombre del archivo con timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.sql`);

// Parsear DATABASE_URL
const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL no encontrada en .env');
  process.exit(1);
}

// Extraer datos de la URL
const url = new URL(dbUrl);
const host = url.hostname;
const port = url.port || '5432';
const database = url.pathname.slice(1).split('?')[0];
const username = url.username;
const password = url.password;

console.log('🔄 Iniciando backup de la base de datos...');
console.log(`📦 Base de datos: ${database}`);
console.log(`💾 Archivo: ${backupFile}`);

// Comando pg_dump
const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${backupFile}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error al hacer backup:', error.message);
    return;
  }
  
  if (stderr && !stderr.includes('WARNING')) {
    console.error('⚠️ Advertencias:', stderr);
  }
  
  // Verificar que el archivo se creó
  if (fs.existsSync(backupFile)) {
    const stats = fs.statSync(backupFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Backup completado exitosamente!`);
    console.log(`📊 Tamaño: ${fileSizeMB} MB`);
    console.log(`📁 Ubicación: ${backupFile}`);
    
    // Limpiar backups antiguos (mantener solo los últimos 7 días)
    cleanOldBackups();
  } else {
    console.error('❌ El archivo de backup no se creó');
  }
});

function cleanOldBackups() {
  const files = fs.readdirSync(BACKUP_DIR);
  const backupFiles = files.filter(f => f.startsWith('backup-') && f.endsWith('.sql'));
  
  if (backupFiles.length > 7) {
    // Ordenar por fecha (más antiguos primero)
    backupFiles.sort();
    
    // Eliminar los más antiguos
    const toDelete = backupFiles.slice(0, backupFiles.length - 7);
    toDelete.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      fs.unlinkSync(filePath);
      console.log(`🗑️  Backup antiguo eliminado: ${file}`);
    });
  }
}
