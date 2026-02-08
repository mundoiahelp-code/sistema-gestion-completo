import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/**
 * Middleware de aislamiento de tenants
 * Asegura que todas las queries incluyan el tenantId del usuario autenticado
 * Previene fugas de datos entre tenants
 */

export const ensureTenantIsolation = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Solo aplicar a usuarios autenticados (excepto SUPER_ADMIN)
  if (!req.user) {
    return next();
  }

  // SUPER_ADMIN puede ver todos los tenants
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  // Verificar que el usuario tenga un tenantId
  if (!req.user.tenantId) {
    return res.status(403).json({ 
      error: 'Usuario sin tenant asignado',
      code: 'NO_TENANT'
    });
  }

  // Agregar tenantId a los query params para facilitar su uso
  req.query.tenantId = req.user.tenantId;

  next();
};

/**
 * Helper para validar que un recurso pertenece al tenant del usuario
 * Usar en controladores antes de operaciones sensibles
 */
export const validateTenantOwnership = (resourceTenantId: string, userTenantId: string, userRole: string): boolean => {
  // SUPER_ADMIN puede acceder a cualquier tenant
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }

  // Verificar que el recurso pertenece al tenant del usuario
  return resourceTenantId === userTenantId;
};

/**
 * Middleware para validar que el tenantId en el body/params coincide con el del usuario
 * Previene que usuarios modifiquen recursos de otros tenants
 */
export const validateTenantInRequest = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  const tenantIdInRequest = req.body.tenantId || req.params.tenantId;

  // Si hay un tenantId en la request, debe coincidir con el del usuario
  if (tenantIdInRequest && tenantIdInRequest !== req.user.tenantId) {
    return res.status(403).json({ 
      error: 'No tienes permisos para acceder a este tenant',
      code: 'TENANT_MISMATCH'
    });
  }

  next();
};
