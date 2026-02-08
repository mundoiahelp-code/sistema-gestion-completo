import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AppError } from '../lib/errors';

export const checkRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        throw new AppError('No autorizado', 401);
      }

      // SUPER_ADMIN tiene acceso a todo
      if (userRole === 'SUPER_ADMIN') {
        return next();
      }

      // Verificar si el rol del usuario está en los roles permitidos
      if (!allowedRoles.includes(userRole)) {
        throw new AppError('No tienes permisos para realizar esta acción', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
