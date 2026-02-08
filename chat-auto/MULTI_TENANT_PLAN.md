# Plan de Implementación Multi-Tenant

## Problema Actual
- 1 solo cliente de WhatsApp para todos los tenants
- Si un tenant escanea QR, desconecta a los demás
- No hay separación de sesiones

## Solución Propuesta

### Opción 1: Múltiples Procesos (RECOMENDADA - MÁS SIMPLE)
Cada tenant tiene su propio proceso del bot:

```
Tenant 1 → Bot Process 1 (Puerto 3001) → WhatsApp 1
Tenant 2 → Bot Process 2 (Puerto 3002) → WhatsApp 2  
Tenant 3 → Bot Process 3 (Puerto 3003) → WhatsApp 3
```

**Ventajas:**
- Aislamiento total
- Fácil de implementar
- Si un bot falla, no afecta a los demás
- Cada uno tiene su propia carpeta auth_info

**Desventajas:**
- Más uso de memoria (pero manejable)
- Necesita un process manager (PM2)

### Opción 2: Un Proceso con Múltiples Instancias (MÁS COMPLEJA)
Un solo proceso maneja todas las instancias de WhatsApp

**Ventajas:**
- Menos uso de memoria
- Un solo proceso para monitorear

**Desventajas:**
- Más complejo de implementar
- Si el proceso falla, caen todos
- Más difícil de debuggear

## Implementación Recomendada: Opción 1

### Paso 1: Modificar el bot para aceptar TENANT_ID
```bash
# .env
TENANT_ID=tenant-uuid-here
TENANT_NAME=Mundo Apple
BOT_API_PORT=3001
```

### Paso 2: Usar PM2 para manejar múltiples procesos
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'bot-tenant-1',
      script: 'src/index.js',
      env: {
        TENANT_ID: 'uuid-1',
        TENANT_NAME: 'Mundo Apple',
        BOT_API_PORT: 3001
      }
    },
    {
      name: 'bot-tenant-2',
      script: 'src/index.js',
      env: {
        TENANT_ID: 'uuid-2',
        TENANT_NAME: 'Apple Store Norte',
        BOT_API_PORT: 3002
      }
    }
  ]
};
```

### Paso 3: El servidor principal (server) sabe a qué puerto enviar
```javascript
// server/src/services/whatsapp.service.ts
const tenantBotPort = await getTenantBotPort(tenantId);
await axios.post(`http://localhost:${tenantBotPort}/api/send-message`, {
  phone, message
});
```

## Costos de Recursos

### 1 Bot (1 Tenant):
- RAM: ~150MB
- CPU: ~5% idle, ~20% activo

### 10 Bots (10 Tenants):
- RAM: ~1.5GB
- CPU: ~10% idle, ~50% activo con carga

**Servidor recomendado:** 4GB RAM, 2 CPU cores = $20-40/mes

## Próximos Pasos

1. ✅ Crear multi-tenant-manager.js (HECHO)
2. ✅ Modificar index.js para leer TENANT_ID del .env (HECHO)
3. ✅ Crear ecosystem.config.js para PM2 (HECHO)
4. ✅ Modificar server para rutear mensajes al bot correcto (HECHO)
5. ✅ Crear script para agregar nuevos tenants automáticamente (HECHO)
6. ✅ Agregar campo botPort al modelo Tenant (HECHO)
7. ✅ Crear migración de base de datos (HECHO)
8. ✅ Documentación completa (HECHO)

## Estado: ✅ IMPLEMENTACIÓN COMPLETA

El sistema multi-tenant está listo para usar. Ver `SETUP_MULTI_TENANT.md` para comenzar.
