import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { refreshPlanLimitsCache } from '../middleware/planLimits';

// Obtener configuración del sistema
export const getSystemConfig = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Solo super admin puede acceder
    if (req.user?.role !== 'SUPERADMIN') {
      throw new AppError('No autorizado', 403);
    }

    // Obtener configuración de la base de datos
    const config = await prisma.systemConfig.findFirst();

    if (!config) {
      // Crear configuración por defecto si no existe
      const defaultConfig = await prisma.systemConfig.create({
        data: {
          trialDuration: 14,
          planLimits: {
            trial: { users: 2, stores: 2, products: 50 },
            basic: { users: 5, stores: 5, products: 200 },
            pro: { users: 15, stores: 10, products: 1000 },
          },
          paymentReminders: {
            enabled: true,
            daysBeforeExpiry: [7, 3, 1],
            afterExpiryDays: [1, 3, 7],
          },
          twoFactorEnabled: false,
          paymentConfig: {
            currency: 'USD',
            taxRate: 0,
            invoicePrefix: 'INV',
            autoInvoice: true,
          },
          maintenanceMode: false,
          maintenanceMessage: '',
        },
      });
      return res.json(defaultConfig);
    }

    res.json(config);
  } catch (error) {
    next(error);
  }
};

// Actualizar sección específica de configuración
export const updateSystemConfig = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Solo super admin puede acceder
    if (req.user?.role !== 'SUPERADMIN') {
      throw new AppError('No autorizado', 403);
    }

    const { section } = req.params;
    const data = req.body;

    let config = await prisma.systemConfig.findFirst();

    if (!config) {
      // Crear si no existe
      config = await prisma.systemConfig.create({
        data: {
          trialDuration: 14,
          planLimits: {},
          paymentReminders: {},
          twoFactorEnabled: false,
          paymentConfig: {},
          maintenanceMode: false,
          maintenanceMessage: '',
        },
      });
    }

    // Actualizar según la sección
    let updateData: any = {};

    switch (section) {
      case 'trial-duration':
        updateData = { trialDuration: data.trialDuration };
        break;
      case 'plan-limits':
        updateData = { planLimits: data.planLimits };
        // Refrescar caché de límites
        refreshPlanLimitsCache();
        break;
      case 'payment-reminders':
        updateData = { paymentReminders: data.paymentReminders };
        break;
      case '2fa':
        updateData = { twoFactorEnabled: data.enabled };
        break;
      case 'payment-config':
        updateData = { paymentConfig: data.paymentConfig };
        break;
      case 'maintenance':
        updateData = {
          maintenanceMode: data.enabled,
          maintenanceMessage: data.message,
        };
        break;
      default:
        throw new AppError('Sección no válida', 400);
    }

    const updated = await prisma.systemConfig.update({
      where: { id: config.id },
      data: updateData,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// Enviar email masivo
export const sendMassEmail = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Solo super admin puede acceder
    if (req.user?.role !== 'SUPERADMIN') {
      throw new AppError('No autorizado', 403);
    }

    const { subject, body } = req.body;

    if (!subject || !body) {
      throw new AppError('Asunto y mensaje son requeridos', 400);
    }

    // Obtener todos los emails de usuarios
    const users = await prisma.user.findMany({
      where: { active: true },
      select: { email: true, name: true },
    });

    // TODO: Implementar envío de emails con servicio de email
    // Por ahora solo retornamos la cantidad
    console.log(`Enviando email masivo a ${users.length} usuarios`);
    console.log('Asunto:', subject);
    console.log('Mensaje:', body);

    res.json({
      sent: users.length,
      message: 'Emails enviados exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

// Obtener logs de actividad
export const getActivityLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Solo super admin puede acceder
    if (req.user?.role !== 'SUPERADMIN') {
      throw new AppError('No autorizado', 403);
    }

    const { tenantId, limit = 100 } = req.query;

    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const logs = await prisma.activityLog.findMany({
      where,
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: { name: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    res.json(logs);
  } catch (error) {
    next(error);
  }
};

// Obtener logs de un negocio específico
export const getTenantLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Solo super admin puede acceder
    if (req.user?.role !== 'SUPERADMIN') {
      throw new AppError('No autorizado', 403);
    }

    const { tenantId } = req.params;
    const { limit = 100 } = req.query;

    const logs = await prisma.activityLog.findMany({
      where: { tenantId },
      take: parseInt(limit as string),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    // Obtener estadísticas del negocio
    const stats = {
      totalActions: logs.length,
      lastActivity: logs[0]?.createdAt || null,
      errorCount: logs.filter(l => l.action.includes('ERROR')).length,
      userCount: await prisma.user.count({ where: { tenantId } }),
      productCount: await prisma.product.count({ where: { tenantId } }),
      saleCount: await prisma.sale.count({ where: { tenantId } }),
    };

    res.json({
      logs,
      stats,
    });
  } catch (error) {
    next(error);
  }
};
