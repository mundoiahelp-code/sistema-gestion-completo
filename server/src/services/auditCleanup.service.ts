import { prisma } from '../lib/prisma';
import cron from 'node-cron';

/**
 * Servicio para limpiar registros de auditoría antiguos
 * Elimina registros mayores a 7 días automáticamente
 */
class AuditCleanupService {
  private isRunning = false;
  private cronJob: cron.ScheduledTask | null = null;

  /**
   * Inicia el servicio de limpieza automática
   * Se ejecuta todos los días a las 3:00 AM
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Audit cleanup service already running');
      return;
    }

    // Ejecutar todos los días a las 3:00 AM
    this.cronJob = cron.schedule('0 3 * * *', async () => {
      await this.cleanup();
    });

    this.isRunning = true;
    console.log('🧹 Audit cleanup service started (runs daily at 3:00 AM)');
  }

  /**
   * Detiene el servicio de limpieza
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('🛑 Audit cleanup service stopped');
  }

  /**
   * Ejecuta la limpieza de registros antiguos
   * Elimina registros de auditoría mayores a 7 días
   */
  async cleanup() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      console.log(`🧹 Starting audit cleanup for records older than ${sevenDaysAgo.toISOString()}`);

      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: sevenDaysAgo
          }
        }
      });

      console.log(`✅ Audit cleanup completed: ${result.count} records deleted`);
      
      return {
        success: true,
        deletedCount: result.count,
        cutoffDate: sevenDaysAgo
      };
    } catch (error) {
      console.error('❌ Error during audit cleanup:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Obtiene estadísticas de los registros de auditoría
   */
  async getStats() {
    try {
      const total = await prisma.auditLog.count();
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const oldRecords = await prisma.auditLog.count({
        where: {
          createdAt: {
            lt: sevenDaysAgo
          }
        }
      });

      const recentRecords = total - oldRecords;

      return {
        total,
        recent: recentRecords,
        old: oldRecords,
        cutoffDate: sevenDaysAgo
      };
    } catch (error) {
      console.error('Error getting audit stats:', error);
      return null;
    }
  }
}

export const auditCleanupService = new AuditCleanupService();
