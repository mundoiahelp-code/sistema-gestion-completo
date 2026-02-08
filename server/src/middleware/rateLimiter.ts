import rateLimit from 'express-rate-limit';
import { AuthRequest } from './auth';

/**
 * Rate limiter general (por IP)
 * Previene abuso de endpoints públicos
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requests por ventana (aumentado de 100)
  message: {
    error: 'Demasiadas solicitudes desde esta IP',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip en desarrollo
    return process.env.NODE_ENV !== 'production';
  }
});

/**
 * Rate limiter por tenant
 * Previene que un tenant abuse de los recursos
 */
export const tenantLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 300, // 300 requests por minuto por tenant (aumentado de 60)
  keyGenerator: (req: AuthRequest) => {
    // Usar tenantId como key
    return req.user?.tenantId || 'anonymous';
  },
  message: {
    error: 'Límite de solicitudes excedido para tu negocio',
    code: 'TENANT_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minuto'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: AuthRequest) => {
    // Skip para super admin
    return req.user?.role === 'SUPER_ADMIN';
  }
});

/**
 * Rate limiter para operaciones costosas
 * Endpoints que consumen muchos recursos o servicios externos
 */
export const expensiveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 requests por minuto (aumentado de 10)
  keyGenerator: (req: AuthRequest) => {
    return req.user?.tenantId || 'anonymous';
  },
  message: {
    error: 'Demasiadas operaciones costosas',
    code: 'EXPENSIVE_RATE_LIMIT_EXCEEDED',
    message: 'Espera un momento antes de intentar nuevamente',
    retryAfter: '1 minuto'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: AuthRequest) => {
    // Skip para super admin
    return req.user?.role === 'SUPER_ADMIN';
  }
});

/**
 * Rate limiter para autenticación
 * Previene ataques de fuerza bruta
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por ventana (aumentado de 5)
  skipSuccessfulRequests: true, // Solo contar intentos fallidos
  message: {
    error: 'Demasiados intentos de inicio de sesión',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Espera 15 minutos antes de intentar nuevamente',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter para creación de recursos
 * Previene spam de creación de registros
 */
export const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 50, // 50 creaciones por minuto (aumentado de 20)
  keyGenerator: (req: AuthRequest) => {
    return req.user?.tenantId || 'anonymous';
  },
  message: {
    error: 'Demasiadas creaciones en poco tiempo',
    code: 'CREATE_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minuto'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: AuthRequest) => {
    return req.user?.role === 'SUPER_ADMIN';
  }
});
