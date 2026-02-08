import cron from 'node-cron';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

class BackupService {
  private backupDir: string;
  private isRunning: boolean = false;

  constructor() {
    this.backupDir = path.join(__dirname, '../../backups');
    this.ensureBackupDir();
  }

  private ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log('📁 Carpeta de backups creada');
    }
  }

  async createBackup(): Promise<{ success: boolean; file?: string; error?: string }> {
    if (this.isRunning) {
      return { success: false, error: 'Ya hay un backup en proceso' };
    }

    this.isRunning = true;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    const backupFile = path.join(this.backupDir, `backup-${timestamp}.sql`);

    try {
      const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
      
      if (!dbUrl) {
        throw new Error('DATABASE_URL no configurada');
      }

      // Si es SQLite (desarrollo)
      if (dbUrl.startsWith('file:')) {
        const dbPath = dbUrl.replace('file:', '');
        const fullDbPath = path.join(__dirname, '../../', dbPath);
        
        if (fs.existsSync(fullDbPath)) {
          fs.copyFileSync(fullDbPath, backupFile.replace('.sql', '.db'));
          console.log('✅ Backup SQLite completado');
          this.cleanOldBackups();
          return { success: true, file: backupFile.replace('.sql', '.db') };
        } else {
          throw new Error('Base de datos SQLite no encontrada');
        }
      }

      // Si es PostgreSQL (producción)
      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.slice(1).split('?')[0];
      const username = url.username;
      const password = url.password;

      console.log('🔄 Iniciando backup de PostgreSQL...');

      const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} -F p -f "${backupFile}"`;
      
      await execAsync(command);

      if (fs.existsSync(backupFile)) {
        const stats = fs.statSync(backupFile);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`✅ Backup completado: ${fileSizeMB} MB`);
        
        this.cleanOldBackups();
        return { success: true, file: backupFile };
      } else {
        throw new Error('El archivo de backup no se creó');
      }
    } catch (error: any) {
      console.error('❌ Error en backup:', error.message);
      return { success: false, error: error.message };
    } finally {
      this.isRunning = false;
    }
  }

  private cleanOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files
        .filter(f => f.startsWith('backup-') && (f.endsWith('.sql') || f.endsWith('.db')))
        .map(f => ({
          name: f,
          path: path.join(this.backupDir, f),
          time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Más recientes primero

      // Mantener solo los últimos 7 backups
      if (backupFiles.length > 7) {
        const toDelete = backupFiles.slice(7);
        toDelete.forEach(file => {
          fs.unlinkSync(file.path);
          console.log(`🗑️  Backup antiguo eliminado: ${file.name}`);
        });
      }
    } catch (error: any) {
      console.error('⚠️  Error limpiando backups antiguos:', error.message);
    }
  }

  getBackupList(): Array<{ name: string; size: string; date: Date }> {
    try {
      const files = fs.readdirSync(this.backupDir);
      return files
        .filter(f => f.startsWith('backup-') && (f.endsWith('.sql') || f.endsWith('.db')))
        .map(f => {
          const filePath = path.join(this.backupDir, f);
          const stats = fs.statSync(filePath);
          return {
            name: f,
            size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
            date: stats.mtime
          };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error obteniendo lista de backups:', error);
      return [];
    }
  }

  startAutomaticBackups() {
    // Backup diario a las 3:00 AM
    cron.schedule('0 3 * * *', async () => {
      console.log('⏰ Ejecutando backup automático programado...');
      const result = await this.createBackup();
      if (result.success) {
        console.log('✅ Backup automático completado');
      } else {
        console.error('❌ Backup automático falló:', result.error);
      }
    });

    console.log('🔄 Backup automático programado (diario a las 3:00 AM)');
  }
}

export const backupService = new BackupService();
