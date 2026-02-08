import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from './auth';

// Middleware para registrar acciones en el sistema
export const auditLog = (action: string, entity: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Guardar la función original de res.json
    const originalJson = res.json.bind(res);
    
    // Sobrescribir res.json para capturar la respuesta
    res.json = function(body: any) {
      // Solo registrar si la operación fue exitosa (status 200-299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Registrar en background (no bloquear la respuesta)
        setImmediate(async () => {
          try {
            const user = req.user;
            if (!user) return;
            
            // Obtener el nombre del usuario desde la base de datos
            const fullUser = await prisma.user.findUnique({
              where: { id: user.id },
              select: { name: true }
            });
            
            // Extraer información relevante
            const entityId = body?.id || body?.product?.id || body?.sale?.id || body?.client?.id || req.params?.id;
            const entityName = body?.name || body?.product?.name || body?.client?.name || body?.email;
            
            // Obtener IP y User Agent
            const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
            const userAgent = req.get('user-agent') || 'unknown';
            
            // Preparar cambios (para UPDATE)
            let changes = null;
            if (action === 'UPDATE' && req.body) {
              changes = JSON.stringify({
                updated: req.body
              });
            }
            
            // Crear registro de auditoría
            await prisma.auditLog.create({
              data: {
                userId: user.id,
                userName: fullUser?.name || user.email,
                userRole: user.role,
                tenantId: user.tenantId,
                action,
                entity,
                entityId,
                entityName,
                changes,
                ipAddress,
                userAgent
              }
            });
          } catch (error) {
            console.error('Error creating audit log:', error);
            // No fallar la request si falla el audit log
          }
        });
      }
      
      // Llamar a la función original
      return originalJson(body);
    };
    
    next();
  };
};

// Función helper para registrar manualmente
export const createAuditLog = async (data: {
  userId: string;
  userName: string;
  userRole: string;
  tenantId: string;
  action: string;
  entity: string;
  entityId?: string;
  entityName?: string;
  changes?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        ...data,
        changes: data.changes ? JSON.stringify(data.changes) : null,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null
      }
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
};
