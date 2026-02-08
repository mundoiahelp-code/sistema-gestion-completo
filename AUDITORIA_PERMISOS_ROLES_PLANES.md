# 🔐 AUDITORÍA DE PERMISOS, ROLES Y PLANES

**Fecha:** 04/02/2026  
**Estado:** ✅ COMPLETADA  
**Objetivo:** Definir claramente permisos por rol y limitaciones por plan

---

## 📊 RESUMEN EJECUTIVO

### 🎭 ROLES IDENTIFICADOS

El sistema tiene **4 roles** definidos:

1. **SUPER_ADMIN** - Dueño del sistema (multi-tenant)
2. **ADMIN** - Administrador del negocio (tenant)
3. **MANAGER** - Gerente/Encargado
4. **SELLER** - Vendedor

### 💳 PLANES IDENTIFICADOS

El sistema tiene **3 planes** definidos:

1. **Trial** (Prueba gratuita - 14 días)
2. **Basic** (Básico - $45,000 ARS)
3. **Pro** (Profesional - $109,000 ARS)

---

## 🎭 PERMISOS POR ROL

### 1. SUPER_ADMIN (Dueño del Sistema)

**Descripción:** Administrador global del sistema multi-tenant. Gestiona todos los negocios.

**Permisos:**
- ✅ **Acceso total** a todos los tenants
- ✅ **Panel de administración** (`/panel`)
- ✅ **Crear/editar/eliminar tenants**
- ✅ **Cambiar planes** de cualquier tenant
- ✅ **Ver estadísticas globales** de IA y revenue
- ✅ **Gestionar pagos** de todos los tenants
- ✅ **Activar/desactivar tenants**
- ✅ **Eliminar tenants permanentemente**
- ✅ **Bypass de suscripción** (no se bloquea por plan vencido)
- ✅ **Acceso a todas las rutas** sin restricciones

**Rutas exclusivas:**
```typescript
GET    /api/tenants                    // Listar todos los tenants
POST   /api/tenants                    // Crear tenant
POST   /api/tenants/invite             // Crear tenant con invitación
POST   /api/tenants/create-invitation  // Crear invitación de negocio
GET    /api/tenants/ai-stats/global    // Estadísticas globales de IA
GET    /api/tenants/revenue/monthly    // Revenue mensual global
GET    /api/tenants/:id/payments       // Pagos de un tenant
POST   /api/tenants/:id/payments       // Crear pago para tenant
PATCH  /api/tenants/:id/price          // Actualizar precio de tenant
GET    /api/tenants/:id/ai-stats       // Stats IA de tenant
PATCH  /api/tenants/:id/ai-toggle      // Activar/desactivar IA
PATCH  /api/tenants/:id/activate       // Activar tenant
PATCH  /api/tenants/:id/deactivate     // Desactivar tenant
PATCH  /api/tenants/:id/plan           // Cambiar plan
DELETE /api/tenants/:id/permanent      // Eliminar permanentemente
DELETE /api/tenants/:id                // Desactivar tenant
```

**Limitaciones:**
- ❌ Ninguna (acceso total)

---

### 2. ADMIN (Administrador del Negocio)

**Descripción:** Dueño/administrador de un negocio específico (tenant). Tiene control total sobre su negocio.

**Permisos:**
- ✅ **Gestión completa** de su tenant
- ✅ **Crear/editar/eliminar usuarios** de su negocio
- ✅ **Crear/editar/eliminar sucursales**
- ✅ **Crear/editar/eliminar productos**
- ✅ **Crear/editar/eliminar clientes**
- ✅ **Ver/crear/cancelar ventas**
- ✅ **Ver/crear/cancelar órdenes**
- ✅ **Configurar integraciones** (WhatsApp, Instagram)
- ✅ **Configurar bot** (tono, idioma, horarios)
- ✅ **Subir/eliminar logo personalizado**
- ✅ **Cambiar idioma del sistema**
- ✅ **Configurar modelos/categorías ocultas**
- ✅ **Completar onboarding**
- ✅ **Ver dashboard completo** (con costos y ganancias)
- ✅ **Exportar reportes**
- ✅ **Gestionar turnos**
- ✅ **Ver historial de precios**
- ✅ **Transferir productos** entre sucursales
- ✅ **Reservar productos**

**Rutas con acceso:**
```typescript
// Usuarios (solo ADMIN)
GET    /api/users                      // Listar usuarios de su tenant
GET    /api/users/:id                  // Ver usuario
POST   /api/users                      // Crear usuario
PUT    /api/users/:id                  // Editar usuario
DELETE /api/users/:id                  // Eliminar usuario

// Tenant (ADMIN + SUPER_ADMIN)
GET    /api/tenants/:id                // Ver su tenant
PATCH  /api/tenants/:id                // Editar su tenant
PATCH  /api/tenants/current/locale     // Cambiar idioma
PATCH  /api/tenants/current/hidden-models
PATCH  /api/tenants/current/hidden-categories
POST   /api/tenants/current/onboarding
POST   /api/tenants/current/logo
DELETE /api/tenants/current/logo

// Sucursales
DELETE /api/stores/:id                 // Solo ADMIN puede eliminar

// Ventas
PUT    /api/sales/:id                  // ADMIN + MANAGER
DELETE /api/sales/:id                  // Solo ADMIN

// Órdenes
PUT    /api/orders/:id                 // ADMIN + MANAGER
DELETE /api/orders/:id                 // Solo ADMIN

// Productos
DELETE /api/products/:id               // ADMIN + MANAGER
POST   /api/products/transfer          // ADMIN + MANAGER
POST   /api/products/:id/barcode       // ADMIN + MANAGER

// Fotos de productos
POST   /api/product-photos             // ADMIN + MANAGER
POST   /api/product-photos/model       // ADMIN + MANAGER
DELETE /api/product-photos/:id         // ADMIN + MANAGER

// Plantillas de productos
POST   /api/product-templates          // ADMIN + MANAGER
PATCH  /api/product-templates/:id      // ADMIN + MANAGER
DELETE /api/product-templates/:id      // ADMIN + MANAGER
```

**Limitaciones:**
- ❌ **No puede** gestionar otros tenants
- ❌ **No puede** cambiar su propio plan (debe contactar soporte)
- ❌ **No puede** ver panel de super admin
- ⚠️ **Sujeto a límites del plan** (usuarios, sucursales, features)

---

### 3. MANAGER (Gerente/Encargado)

**Descripción:** Gerente de sucursal con permisos elevados pero sin acceso a configuración crítica.

**Permisos:**
- ✅ **Crear/editar productos**
- ✅ **Crear/editar clientes**
- ✅ **Ver/crear ventas**
- ✅ **Editar ventas** (no eliminar)
- ✅ **Ver/crear órdenes**
- ✅ **Editar órdenes** (no eliminar)
- ✅ **Crear/editar sucursales**
- ✅ **Transferir productos**
- ✅ **Reservar productos**
- ✅ **Ver dashboard** (sin costos ni ganancias)
- ✅ **Gestionar turnos**
- ✅ **Configurar bot** (junto con ADMIN)
- ✅ **Subir fotos de productos**
- ✅ **Gestionar plantillas de productos**

**Rutas con acceso:**
```typescript
// Sucursales (ADMIN + MANAGER + SELLER)
POST   /api/stores                     // Crear sucursal
PUT    /api/stores/:id                 // Editar sucursal
PATCH  /api/stores/:id                 // Editar sucursal

// Productos (ADMIN + MANAGER + SELLER)
POST   /api/products                   // Crear producto
PATCH  /api/products/:id               // Editar producto
PUT    /api/products/:id               // Editar producto

// Productos (ADMIN + MANAGER)
DELETE /api/products/:id               // Eliminar producto
POST   /api/products/transfer          // Transferir producto
POST   /api/products/:id/barcode       // Generar código

// Ventas (ADMIN + MANAGER)
PUT    /api/sales/:id                  // Editar venta

// Órdenes (ADMIN + MANAGER)
PUT    /api/orders/:id                 // Editar orden

// Bot (ADMIN + MANAGER)
PATCH  /api/tenants/current/bot        // Configurar bot
```

**Limitaciones:**
- ❌ **No puede** crear/editar/eliminar usuarios
- ❌ **No puede** eliminar ventas
- ❌ **No puede** eliminar órdenes
- ❌ **No puede** eliminar sucursales
- ❌ **No puede** cambiar configuración del tenant
- ❌ **No puede** ver costos ni ganancias en dashboard
- ❌ **No puede** exportar reportes con costos

---

### 4. SELLER (Vendedor)

**Descripción:** Vendedor básico con permisos mínimos para operar el sistema.

**Permisos:**
- ✅ **Ver productos**
- ✅ **Crear productos** (básico)
- ✅ **Editar productos** (básico)
- ✅ **Ver clientes**
- ✅ **Crear clientes**
- ✅ **Ver ventas**
- ✅ **Crear ventas**
- ✅ **Ver órdenes**
- ✅ **Crear órdenes**
- ✅ **Ver dashboard básico** (sin totales ni ganancias)
- ✅ **Reservar productos**
- ✅ **Crear/editar sucursales** (limitado)

**Rutas con acceso:**
```typescript
// Productos (ADMIN + MANAGER + SELLER)
POST   /api/products                   // Crear producto
PATCH  /api/products/:id               // Editar producto
PUT    /api/products/:id               // Editar producto

// Sucursales (ADMIN + MANAGER + SELLER)
POST   /api/stores                     // Crear sucursal
PUT    /api/stores/:id                 // Editar sucursal
PATCH  /api/stores/:id                 // Editar sucursal

// Ventas (todos los roles autenticados)
GET    /api/sales                      // Ver ventas
GET    /api/sales/:id                  // Ver venta
POST   /api/sales                      // Crear venta

// Órdenes (todos los roles autenticados)
GET    /api/orders                     // Ver órdenes
GET    /api/orders/:id                 // Ver orden
POST   /api/orders                     // Crear orden

// Clientes (todos los roles autenticados)
GET    /api/clients                    // Ver clientes
GET    /api/clients/:id                // Ver cliente
POST   /api/clients                    // Crear cliente
```

**Limitaciones:**
- ❌ **No puede** eliminar productos
- ❌ **No puede** eliminar ventas
- ❌ **No puede** eliminar órdenes
- ❌ **No puede** eliminar sucursales
- ❌ **No puede** editar/eliminar ventas
- ❌ **No puede** editar/eliminar órdenes
- ❌ **No puede** transferir productos
- ❌ **No puede** ver costos ni ganancias
- ❌ **No puede** ver totales en tabla de ventas
- ❌ **No puede** gestionar usuarios
- ❌ **No puede** configurar integraciones
- ❌ **No puede** configurar bot

---

## 💳 LIMITACIONES POR PLAN

### Plan: TRIAL (Prueba Gratuita)

**Duración:** 7 días  
**Precio:** $0  
**Estado:** ⚠️ Expira el 01/02/2025 (VENCIDO)

**Límites:**
- 👥 **Usuarios:** Máximo 4
- 🏪 **Sucursales:** Máximo 2
- 📦 **Productos:** Ilimitados
- 💰 **Ventas:** Ilimitadas

**Features disponibles:**
- ✅ **Gestión básica** (productos, ventas, clientes, órdenes)
- ✅ **Dashboard básico**
- ✅ **Turnos manuales**
- ❌ **CRM** (no disponible)
- ❌ **WhatsApp** (no disponible)
- ❌ **Bot IA** (no disponible)
- ❌ **Turnos online** (no disponible)
- ❌ **Integraciones** (no disponible)

**Enforcement actual:**
- ✅ Límite de usuarios **IMPLEMENTADO** en `user.controller.ts`
- ✅ Límite de sucursales **IMPLEMENTADO** en `store.controller.ts`
- ⚠️ Features **PARCIALMENTE IMPLEMENTADAS** (frontend)
- ❌ Bloqueo por expiración **NO IMPLEMENTADO** (trial vencido sigue funcionando)

---

### Plan: BASIC (Básico)

**Precio:** $45,000 ARS / mes  
**Usuarios:** Máximo 8  
**Sucursales:** Máximo 5

**Límites:**
- 👥 **Usuarios:** Máximo 8
- 🏪 **Sucursales:** Máximo 5
- 📦 **Productos:** Ilimitados
- 💰 **Ventas:** Ilimitadas

**Features disponibles:**
- ✅ **Gestión completa** (productos, ventas, clientes, órdenes)
- ✅ **Dashboard completo**
- ✅ **CRM** (ver mensajes de WhatsApp)
- ✅ **WhatsApp manual** (conectar QR, enviar mensajes)
- ✅ **Turnos manuales**
- ✅ **Integraciones** (WhatsApp sin bot)
- ❌ **Bot IA** (no disponible)
- ❌ **Turnos online** (no disponible)
- ❌ **Respuestas automáticas** (no disponible)

**Enforcement actual:**
- ✅ Límite de usuarios **IMPLEMENTADO** en `user.controller.ts`
- ✅ Límite de sucursales **IMPLEMENTADO** en `store.controller.ts`
- ⚠️ Features **PARCIALMENTE IMPLEMENTADAS** (frontend)
- ❌ Validación de plan en backend **NO IMPLEMENTADA** (cualquiera puede usar features Pro)

---

### Plan: PRO (Profesional)

**Precio:** $109,000 ARS / mes  
**Usuarios:** Máximo 18  
**Sucursales:** Máximo 10

**Límites:**
- 👥 **Usuarios:** Máximo 18
- 🏪 **Sucursales:** Máximo 10
- 📦 **Productos:** Ilimitados
- 💰 **Ventas:** Ilimitadas

**Features disponibles:**
- ✅ **Gestión completa** (productos, ventas, clientes, órdenes)
- ✅ **Dashboard completo**
- ✅ **CRM completo** (ver y responder mensajes)
- ✅ **WhatsApp completo** (QR + Bot IA)
- ✅ **Bot IA** (respuestas automáticas inteligentes)
- ✅ **Turnos manuales**
- ✅ **Turnos online** (clientes pueden agendar)
- ✅ **Integraciones completas** (WhatsApp + Bot)
- ✅ **Reportes avanzados**

**Enforcement actual:**
- ✅ Límite de usuarios **IMPLEMENTADO** en `user.controller.ts`
- ✅ Límite de sucursales **IMPLEMENTADO** en `store.controller.ts`
- ⚠️ Features **PARCIALMENTE IMPLEMENTADAS** (frontend)
- ❌ Validación de plan en backend **NO IMPLEMENTADA** (cualquiera puede usar features Pro)

---

## ⚠️ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 🔴 ALTA PRIORIDAD

#### 1. **Features no validadas en backend**
**Problema:** El frontend oculta features según el plan, pero el backend NO valida.  
**Riesgo:** Un usuario Basic puede usar el bot IA si conoce los endpoints.  
**Solución:** Crear middleware `checkPlanFeature` para validar en cada ruta.

```typescript
// Ejemplo de lo que falta:
export const checkPlanFeature = (feature: 'crm' | 'bot' | 'onlineTurnos') => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const plan = req.tenant?.plan || 'trial';
    const hasAccess = PLANS[plan][`has${feature}`];
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Feature no disponible en tu plan',
        requiredPlan: feature === 'bot' ? 'pro' : 'basic'
      });
    }
    next();
  };
};
```

#### 2. **Trial vencido sigue funcionando**
**Problema:** El trial expira el 01/02/2025 pero no hay bloqueo.  
**Riesgo:** Usuarios usan el sistema gratis indefinidamente.  
**Solución:** Implementar `checkSubscription` middleware en todas las rutas.

#### 3. **Inconsistencia entre frontend y backend**
**Problema:** Frontend tiene 2 archivos de configuración de planes diferentes:
- `sistema/src/config/plans.ts` - Configuración detallada
- `sistema/src/hooks/usePlan.ts` - Configuración duplicada

**Riesgo:** Cambios en uno no se reflejan en el otro.  
**Solución:** Unificar en un solo archivo de configuración.

#### 4. **Límites de sucursales inconsistentes**
**Backend:** trial=2, basic=5, pro=10  
**Frontend (usePlan.ts):** trial=2, basic=5, pro=10 ✅  
**Frontend (plans.ts):** NO DEFINIDO ❌

**Solución:** Agregar `maxStores` a `plans.ts`.

#### 5. **SELLER puede crear sucursales**
**Problema:** El rol SELLER tiene permiso para crear/editar sucursales.  
**Riesgo:** Vendedores pueden modificar estructura del negocio.  
**Solución:** Remover SELLER de rutas de sucursales.

```typescript
// ACTUAL (INCORRECTO):
router.post('/', authorize('ADMIN', 'MANAGER', 'SELLER'), createStore);

// CORRECTO:
router.post('/', authorize('ADMIN', 'MANAGER'), createStore);
```

#### 6. **SELLER puede editar productos sin restricción**
**Problema:** SELLER puede editar cualquier producto.  
**Riesgo:** Vendedores pueden cambiar precios, costos, etc.  
**Solución:** Limitar qué campos puede editar SELLER.

---

### 🟡 MEDIA PRIORIDAD

#### 7. **Dashboard muestra costos a SELLER**
**Problema:** El frontend oculta totales pero el backend envía todos los datos.  
**Riesgo:** SELLER puede ver costos en DevTools.  
**Solución:** Filtrar datos sensibles en backend según rol.

#### 8. **No hay límite de productos**
**Problema:** Todos los planes tienen productos ilimitados.  
**Riesgo:** Abuso de almacenamiento/base de datos.  
**Solución:** Considerar límite de productos por plan.

#### 9. **Features basadas en locale**
**Problema:** `sistema/src/lib/features.ts` habilita/deshabilita features según idioma.  
**Riesgo:** Confusión entre features por plan vs features por idioma.  
**Solución:** Separar features de idioma de features de plan.

---

## ✅ PROPUESTA DE CORRECCIÓN

### Fase 1: Validación de Plan en Backend (CRÍTICO)

**1. Crear middleware de validación de features:**

```typescript
// server/src/middleware/planFeatures.ts
import { AuthRequest } from './auth';
import { Response, NextFunction } from 'express';

const PLAN_FEATURES = {
  trial: {
    crm: false,
    bot: false,
    whatsapp: false,
    onlineTurnos: false,
    integrations: false
  },
  basic: {
    crm: true,
    bot: false,
    whatsapp: true, // Solo manual, sin bot
    onlineTurnos: false,
    integrations: true
  },
  pro: {
    crm: true,
    bot: true,
    whatsapp: true,
    onlineTurnos: true,
    integrations: true
  }
};

export const requireFeature = (feature: keyof typeof PLAN_FEATURES.trial) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // SUPER_ADMIN siempre tiene acceso
    if (req.user?.role === 'SUPER_ADMIN') {
      return next();
    }

    const plan = req.tenant?.plan || 'trial';
    const hasFeature = PLAN_FEATURES[plan as keyof typeof PLAN_FEATURES]?.[feature];

    if (!hasFeature) {
      const requiredPlan = feature === 'bot' || feature === 'onlineTurnos' ? 'pro' : 'basic';
      return res.status(403).json({
        error: 'Feature no disponible en tu plan',
        feature,
        currentPlan: plan,
        requiredPlan,
        upgradeUrl: '/suscripcion'
      });
    }

    next();
  };
};
```

**2. Aplicar middleware en rutas críticas:**

```typescript
// server/src/routes/whatsapp.routes.ts
router.use(requireFeature('whatsapp')); // Todas las rutas de WhatsApp

// server/src/routes/bot.routes.ts
router.use(requireFeature('bot')); // Todas las rutas del bot

// server/src/routes/appointment.routes.ts
router.post('/online', requireFeature('onlineTurnos'), createOnlineAppointment);

// server/src/routes/broadcast.routes.ts
router.use(requireFeature('integrations'));
```

**3. Implementar bloqueo por suscripción vencida:**

```typescript
// Aplicar en TODAS las rutas excepto auth y public
app.use('/api/', authenticate, checkSubscription);
```

---

### Fase 2: Corrección de Permisos por Rol

**1. Remover SELLER de rutas de sucursales:**

```typescript
// server/src/routes/store.routes.ts
router.post('/', authorize('ADMIN', 'MANAGER'), createStore);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateStore);
router.patch('/:id', authorize('ADMIN', 'MANAGER'), updateStore);
```

**2. Limitar edición de productos por SELLER:**

```typescript
// server/src/controllers/product.controller.ts
export const updateProduct = async (req: AuthRequest, res: Response) => {
  const role = req.user?.role;
  
  // SELLER solo puede editar campos básicos
  if (role === 'SELLER') {
    const allowedFields = ['stock', 'reserved', 'description', 'condition'];
    const requestedFields = Object.keys(req.body);
    const hasRestrictedFields = requestedFields.some(f => !allowedFields.includes(f));
    
    if (hasRestrictedFields) {
      return res.status(403).json({ 
        error: 'No tienes permisos para editar estos campos',
        allowedFields 
      });
    }
  }
  
  // ... resto del código
};
```

**3. Filtrar datos sensibles en dashboard según rol:**

```typescript
// server/src/controllers/dashboard.controller.ts
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  // ... obtener datos ...
  
  const role = req.user?.role;
  
  // SELLER no ve costos ni ganancias
  if (role === 'SELLER') {
    return res.json({
      totalSales,
      productsSold,
      totalStock,
      phonesStock,
      accessoriesStock,
      salesByMonth,
      lastSales: lastSales.map(s => ({
        id: s.id,
        client: s.client,
        itemsCount: s.items.length,
        createdAt: s.createdAt
        // NO enviar total, cost, profit
      })),
      // NO enviar: totalRevenue, totalProfit, totalCost, capitalTotal, etc.
    });
  }
  
  // ADMIN y MANAGER ven todo
  return res.json({ /* datos completos */ });
};
```

---

### Fase 3: Unificación de Configuración

**1. Crear archivo único de configuración de planes:**

```typescript
// shared/plans.config.ts (compartido entre frontend y backend)
export const PLANS_CONFIG = {
  trial: {
    name: 'Prueba Gratuita',
    price: 0,
    maxUsers: 4,
    maxStores: 2,
    features: {
      gestion: true,
      crm: false,
      whatsapp: false,
      bot: false,
      onlineTurnos: false,
      manualTurnos: true,
      integrations: false
    },
    trialDays: 7,
    expiresAt: '2025-02-01'
  },
  basic: {
    name: 'Básico',
    price: 45000,
    maxUsers: 8,
    maxStores: 5,
    features: {
      gestion: true,
      crm: true,
      whatsapp: true, // Manual, sin bot
      bot: false,
      onlineTurnos: false,
      manualTurnos: true,
      integrations: true
    }
  },
  pro: {
    name: 'Profesional',
    price: 109000,
    maxUsers: 18,
    maxStores: 10,
    features: {
      gestion: true,
      crm: true,
      whatsapp: true,
      bot: true,
      onlineTurnos: true,
      manualTurnos: true,
      integrations: true
    }
  }
} as const;
```

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [ ] Crear middleware `requireFeature`
- [ ] Aplicar `requireFeature` en rutas de WhatsApp
- [ ] Aplicar `requireFeature` en rutas de Bot
- [ ] Aplicar `requireFeature` en rutas de Turnos Online
- [ ] Aplicar `checkSubscription` globalmente
- [ ] Remover SELLER de rutas de sucursales
- [ ] Limitar campos editables por SELLER en productos
- [ ] Filtrar datos sensibles en dashboard según rol
- [ ] Validar límites de usuarios en creación
- [ ] Validar límites de sucursales en creación

### Frontend
- [ ] Unificar configuración de planes
- [ ] Eliminar `usePlan.ts` duplicado
- [ ] Usar `usePlanFeatures.ts` en todos los componentes
- [ ] Mostrar upgrade prompts cuando se intenta usar feature bloqueada
- [ ] Ocultar UI de features no disponibles
- [ ] Mostrar badge de plan actual en sidebar
- [ ] Agregar página de comparación de planes

### Testing
- [ ] Probar acceso a features con plan Trial
- [ ] Probar acceso a features con plan Basic
- [ ] Probar acceso a features con plan Pro
- [ ] Probar límites de usuarios por plan
- [ ] Probar límites de sucursales por plan
- [ ] Probar bloqueo por suscripción vencida
- [ ] Probar permisos de SELLER
- [ ] Probar permisos de MANAGER
- [ ] Probar permisos de ADMIN
- [ ] Probar bypass de SUPER_ADMIN

---

**Última actualización:** 04/02/2026
