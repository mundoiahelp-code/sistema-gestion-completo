import NodeCache from 'node-cache';

/**
 * Caché en memoria para queries frecuentes
 * Reduce carga en base de datos y mejora performance
 */

// Caché general (5 minutos TTL)
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutos
  checkperiod: 60, // Verificar expiración cada 60 segundos
  useClones: false // No clonar objetos (mejor performance)
});

/**
 * Obtener valor del caché o ejecutar función si no existe
 */
export const getCached = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  // Intentar obtener del caché
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }
  
  // Si no existe, ejecutar función y guardar
  const data = await fetchFn();
  cache.set(key, data, ttl);
  return data;
};

/**
 * Guardar valor en caché
 */
export const setCache = <T>(key: string, value: T, ttl?: number): boolean => {
  return cache.set(key, value, ttl);
};

/**
 * Obtener valor del caché
 */
export const getCache = <T>(key: string): T | undefined => {
  return cache.get<T>(key);
};

/**
 * Eliminar valor del caché
 */
export const deleteCache = (key: string): number => {
  return cache.del(key);
};

/**
 * Invalidar caché por patrón
 * Útil para invalidar todos los cachés relacionados con un tenant
 */
export const invalidateCache = (pattern: string): number => {
  const keys = cache.keys().filter(k => k.includes(pattern));
  return cache.del(keys);
};

/**
 * Limpiar todo el caché
 */
export const clearCache = (): void => {
  cache.flushAll();
};

/**
 * Obtener estadísticas del caché
 */
export const getCacheStats = () => {
  return cache.getStats();
};

/**
 * Keys de caché predefinidas para consistencia
 */
export const CacheKeys = {
  tenant: (tenantId: string) => `tenant:${tenantId}`,
  tenantConfig: (tenantId: string) => `tenant:${tenantId}:config`,
  stores: (tenantId: string) => `stores:${tenantId}`,
  planFeatures: (plan: string) => `plan:${plan}:features`,
  userCount: (tenantId: string) => `tenant:${tenantId}:users:count`,
  storeCount: (tenantId: string) => `tenant:${tenantId}:stores:count`,
};

/**
 * Invalidar caché relacionado con un tenant
 */
export const invalidateTenantCache = (tenantId: string): void => {
  invalidateCache(`tenant:${tenantId}`);
  invalidateCache(`stores:${tenantId}`);
};

/**
 * Caché con TTL corto para datos que cambian frecuentemente
 */
export const shortCache = new NodeCache({ 
  stdTTL: 60, // 1 minuto
  checkperiod: 10
});

/**
 * Caché con TTL largo para datos estáticos
 */
export const longCache = new NodeCache({ 
  stdTTL: 3600, // 1 hora
  checkperiod: 300
});
