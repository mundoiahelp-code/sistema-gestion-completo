/**
 * Clases de error personalizadas para manejo robusto de errores
 * Cada error tiene un código específico para facilitar debugging
 */

export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, `${resource} no encontrado${id ? `: ${id}` : ''}`, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(409, message, 'CONFLICT', details);
  }
}

export class InsufficientStockError extends AppError {
  constructor(productName: string, available: number, requested: number) {
    super(409, `Stock insuficiente para ${productName}`, 'INSUFFICIENT_STOCK', {
      productName,
      available,
      requested,
      missing: requested - available
    });
  }
}

export class PlanLimitError extends AppError {
  constructor(resource: string, limit: number, current: number) {
    super(403, `Límite de ${resource} alcanzado`, 'PLAN_LIMIT_EXCEEDED', {
      resource,
      limit,
      current,
      upgradeRequired: true
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'No tienes permisos para esta acción') {
    super(403, message, 'FORBIDDEN');
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: any) {
    super(503, `Error en servicio externo: ${service}`, 'EXTERNAL_SERVICE_ERROR', {
      service,
      originalError: originalError?.message
    });
  }
}

export class TimeoutError extends AppError {
  constructor(operation: string) {
    super(504, `Timeout en operación: ${operation}`, 'TIMEOUT');
  }
}
