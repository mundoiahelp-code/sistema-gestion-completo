import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../lib/prisma';

/**
 * Middleware para registrar actividad de usuarios automáticamente
 * Se ejecuta después de cada request exitoso
 */
export const logActivity = (action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Guardar el método original de res.json
    const originalJson = res.json.bind(res);

    // Sobrescribir res.json para capturar respuestas exitosas
    res.json = function (body: any) {
      // Solo registrar si la respuesta es exitosa (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Registrar actividad de forma asíncrona sin bloquear la respuesta
        if (req.user?.tenantId && req.user.role !== 'SUPER_ADMIN') {
          const details: any = {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
          };

          // Agregar información adicional según el tipo de acción
          if (req.body && Object.keys(req.body).length > 0) {
            details.bodyKeys = Object.keys(req.body);
          }

          prisma.activityLog.create({
            data: {
              tenantId: req.user.tenantId,
              userId: req.user.id,
              action,
              details: JSON.stringify(details),
              ipAddress: req.ip || req.socket.remoteAddress,
              userAgent: req.headers['user-agent'],
            },
          }).catch((err) => {
            // Ignorar errores de logging para no afectar la respuesta
            console.error('Error logging activity:', err);
          });
        }
      }

      // Llamar al método original
      return originalJson(body);
    };

    next();
  };
};

/**
 * Helper para registrar actividad manualmente
 */
export const createActivityLog = async (
  tenantId: string,
  userId: string | null,
  action: string,
  details?: any,
  req?: AuthRequest
) => {
  try {
    await prisma.activityLog.create({
      data: {
        tenantId,
        userId,
        action,
        details: details ? JSON.stringify(details) : null,
        ipAddress: req?.ip || req?.socket.remoteAddress,
        userAgent: req?.headers['user-agent'],
      },
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
  }
};

/**
 * Mapeo de acciones comunes
 */
export const ActivityActions = {
  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  
  // Productos
  CREATE_PRODUCT: 'CREATE_PRODUCT',
  UPDATE_PRODUCT: 'UPDATE_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  
  // Ventas
  CREATE_SALE: 'CREATE_SALE',
  CANCEL_SALE: 'CANCEL_SALE',
  
  // Turnos
  CREATE_APPOINTMENT: 'CREATE_APPOINTMENT',
  UPDATE_APPOINTMENT: 'UPDATE_APPOINTMENT',
  CANCEL_APPOINTMENT: 'CANCEL_APPOINTMENT',
  DELETE_APPOINTMENT: 'DELETE_APPOINTMENT',
  
  // Usuarios
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  
  // Sucursales
  CREATE_STORE: 'CREATE_STORE',
  UPDATE_STORE: 'UPDATE_STORE',
  DELETE_STORE: 'DELETE_STORE',
  
  // Clientes
  CREATE_CLIENT: 'CREATE_CLIENT',
  UPDATE_CLIENT: 'UPDATE_CLIENT',
  DELETE_CLIENT: 'DELETE_CLIENT',
  
  // Errores
  ERROR: 'ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
} as const;
