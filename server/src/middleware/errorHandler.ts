import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

/**
 * Middleware centralizado de manejo de errores
 * Convierte todos los errores en respuestas JSON consistentes
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log del error (solo en desarrollo)
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ Error:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      body: req.body
    });
  }

  // Error personalizado de la app
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details
    });
  }

  // Error de validación de Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Datos inválidos',
      code: 'VALIDATION_ERROR',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code
      }))
    });
  }

  // Errores de Prisma
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        // Unique constraint violation
        return res.status(409).json({
          error: 'Ya existe un registro con esos datos',
          code: 'DUPLICATE_ENTRY',
          field: (err.meta?.target as string[])?.[0]
        });
      
      case 'P2025':
        // Record not found
        return res.status(404).json({
          error: 'Registro no encontrado',
          code: 'NOT_FOUND'
        });
      
      case 'P2003':
        // Foreign key constraint violation
        return res.status(400).json({
          error: 'Referencia inválida',
          code: 'INVALID_REFERENCE',
          field: err.meta?.field_name
        });
      
      case 'P2014':
        // Required relation violation
        return res.status(400).json({
          error: 'Relación requerida faltante',
          code: 'MISSING_RELATION'
        });
      
      default:
        return res.status(400).json({
          error: 'Error de base de datos',
          code: 'DATABASE_ERROR',
          ...(process.env.NODE_ENV !== 'production' && { prismaCode: err.code })
        });
    }
  }

  // Error de validación de Prisma
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      error: 'Datos inválidos para la operación',
      code: 'VALIDATION_ERROR'
    });
  }

  // Error genérico
  return res.status(500).json({
    error: 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { 
      message: err.message,
      stack: err.stack 
    })
  });
};

/**
 * Wrapper para async handlers
 * Captura errores de funciones async y los pasa al error handler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
