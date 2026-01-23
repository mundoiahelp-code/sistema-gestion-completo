import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Obtener historial de auditoría
export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { 
      page = '1', 
      limit = '50',
      userId,
      action,
      entity,
      startDate,
      endDate
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    // Construir filtros
    const where: any = { tenantId };
    
    if (userId) where.userId = userId as string;
    if (action) where.action = action as string;
    if (entity) where.entity = entity as string;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    
    // Obtener logs y total
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.auditLog.count({ where })
    ]);
    
    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(400).json({ error: 'Error al obtener historial' });
  }
};

// Obtener estadísticas de auditoría
export const getAuditStats = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { startDate, endDate } = req.query;
    
    const where: any = { tenantId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }
    
    // Estadísticas por acción
    const actionStats = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
      orderBy: { _count: { action: 'desc' } }
    });
    
    // Estadísticas por entidad
    const entityStats = await prisma.auditLog.groupBy({
      by: ['entity'],
      where,
      _count: true,
      orderBy: { _count: { entity: 'desc' } }
    });
    
    // Estadísticas por usuario
    const userStats = await prisma.auditLog.groupBy({
      by: ['userId', 'userName'],
      where,
      _count: true,
      orderBy: { _count: { userId: 'desc' } },
      take: 10
    });
    
    // Total de acciones
    const totalActions = await prisma.auditLog.count({ where });
    
    res.json({
      totalActions,
      byAction: actionStats.map(s => ({ action: s.action, count: s._count })),
      byEntity: entityStats.map(s => ({ entity: s.entity, count: s._count })),
      byUser: userStats.map(s => ({ 
        userId: s.userId, 
        userName: s.userName, 
        count: s._count 
      }))
    });
  } catch (error) {
    console.error('Error getting audit stats:', error);
    res.status(400).json({ error: 'Error al obtener estadísticas' });
  }
};

// Obtener actividad reciente de un usuario específico
export const getUserActivity = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { userId } = req.params;
    const { limit = '20' } = req.query;
    
    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        userId
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });
    
    res.json({ logs });
  } catch (error) {
    console.error('Error getting user activity:', error);
    res.status(400).json({ error: 'Error al obtener actividad del usuario' });
  }
};
