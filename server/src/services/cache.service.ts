import NodeCache from 'node-cache';

/**
 * Servicio de caché en memoria para optimizar queries frecuentes
 * TTL por defecto: 60 segundos
 */
class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 60, // 60 segundos por defecto
      checkperiod: 120, // Verificar cada 2 minutos
      useClones: false // No clonar objetos (mejor performance)
    });

    console.log('💾 Cache service initialized');
  }

  /**
   * Obtener valor del caché
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Guardar valor en caché
   */
  set(key: string, value: any, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || 60);
  }

  /**
   * Eliminar valor del caché
   */
  del(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Eliminar múltiples valores por patrón
   */
  delPattern(pattern: string): number {
    const keys = this.cache.keys().filter(k => k.includes(pattern));
    return this.cache.del(keys);
  }

  /**
   * Limpiar todo el caché
   */
  flush(): void {
    this.cache.flushAll();
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Wrapper para cachear resultados de funciones
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Intentar obtener del caché
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Si no está en caché, ejecutar función
    const result = await fn();
    
    // Guardar en caché
    this.set(key, result, ttl);
    
    return result;
  }

  /**
   * Invalidar caché de un tenant específico
   */
  invalidateTenant(tenantId: string): void {
    this.delPattern(tenantId);
    console.log(`🔄 Caché invalidado para tenant: ${tenantId}`);
  }

  /**
   * Invalidar caché de productos
   */
  invalidateProducts(tenantId: string): void {
    this.delPattern(`${tenantId}:products`);
    this.delPattern(`${tenantId}:stock`);
    console.log(`🔄 Caché de productos invalidado para tenant: ${tenantId}`);
  }

  /**
   * Invalidar caché de ventas
   */
  invalidateSales(tenantId: string): void {
    this.delPattern(`${tenantId}:sales`);
    this.delPattern(`${tenantId}:dashboard`);
    console.log(`🔄 Caché de ventas invalidado para tenant: ${tenantId}`);
  }

  /**
   * Invalidar caché de clientes
   */
  invalidateClients(tenantId: string): void {
    this.delPattern(`${tenantId}:clients`);
    console.log(`🔄 Caché de clientes invalidado para tenant: ${tenantId}`);
  }
}

export const cacheService = new CacheService();
