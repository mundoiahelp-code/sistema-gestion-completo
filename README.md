# 🍎 Sistema MundoIAple - Gestión de Negocio con IA

Sistema completo de gestión para negocios de tecnología con Asistente IA integrado.

## 🎉 NUEVO: Sistema Multi-Tenant

El sistema ahora soporta **múltiples clientes simultáneos**, cada uno con su propio WhatsApp e IA completamente aislados.

**Ver documentación completa:**
- 📖 **`RESUMEN_MULTI_TENANT.md`** - Resumen ejecutivo
- 🚀 **`SETUP_MULTI_TENANT.md`** - Guía rápida de inicio
- 🧪 **`PROBAR_MULTI_TENANT.md`** - Cómo probar el sistema
- 📚 **`MULTI_TENANT_WHATSAPP.md`** - Documentación completa
- 🔄 **`MIGRACION_A_MULTI_TENANT.md`** - Migrar desde sistema antiguo

---

## 🚀 Inicio Rápido

### Requisitos
- Node.js 18+
- PostgreSQL (o Supabase)
- npm o yarn

### Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd sistema-mundoiaple

# 2. Instalar dependencias
cd server && npm install
cd ../sistema && npm install
cd ../landing && npm install

# 3. Configurar variables de entorno
# Copiar .env.example a .env en cada carpeta y configurar

# 4. Ejecutar migraciones
cd server
npx prisma migrate deploy

# 5. Crear superadmin
npm run setup:superadmin

# 6. Iniciar servicios
npm run dev  # En cada carpeta (server, sistema, landing)
```

## 📁 Estructura del Proyecto

```
.
├── server/          # Backend API (Node.js + Express + Prisma)
├── sistema/         # Frontend Admin (Next.js 14)
├── landing/         # Landing Page (Next.js 14)
├── chat-auto/       # Bot WhatsApp (opcional)
└── README.md        # Este archivo
```

## 🎯 Funcionalidades

### 🆕 Multi-Tenant (NUEVO)
- **Múltiples Clientes**: Vender el sistema a 10, 20 o más tiendas
- **WhatsApp Aislado**: Cada cliente con su propio WhatsApp
- **IA Separada**: Cada cliente con su propia IA que responde automáticamente
- **Datos Aislados**: Nada se mezcla entre clientes
- **Gestión con PM2**: Procesos separados, fácil de monitorear

### ✅ Gestión Completa
- **Productos**: Teléfonos y accesorios con IMEI, códigos de barras, costos
- **Ventas**: Registro de ventas con múltiples métodos de pago (USD/ARS)
- **Clientes**: Base de datos de clientes con historial
- **Usuarios**: Sistema de roles (ADMIN, MANAGER, SELLER)
- **Dashboard**: Métricas en tiempo real, ganancias reales, reportes

### 🔍 Sistema de Auditoría
- Registro automático de todas las acciones
- Historial completo con filtros avanzados
- Información detallada (usuario, fecha, IP, cambios)
- Solo visible para ADMIN

### 🔐 Seguridad
- Autenticación JWT
- Multi-tenant (cada negocio aislado)
- Roles y permisos
- Auditoría completa
- Backups automáticos

### 📊 Reportes y Métricas
- Ventas del mes por moneda
- Ganancias reales (ventas - costos)
- Margen de ganancia
- Top productos vendidos
- Ventas por vendedor

## 🛠️ Scripts Útiles

### Multi-Tenant (NUEVO)
```bash
# Crear nuevo cliente
cd server
node create-tenant.js

# Iniciar bot de un cliente
node start-tenant-bot.js <tenantId>

# Ver todos los bots
pm2 status

# Ver logs de un bot
pm2 logs bot-abc12345

# Reiniciar un bot
pm2 restart bot-abc12345
```

### Backend (server/)
```bash
npm run dev              # Desarrollo
npm run build            # Build producción
npm run start            # Iniciar producción
npm run setup:superadmin # Crear superadmin
npm run clean:db         # Limpiar base de datos
npm run backup           # Backup de BD
npm run health           # Health check
npm run integrity        # Verificar integridad
```

### Frontend (sistema/)
```bash
npm run dev              # Desarrollo
npm run build            # Build producción
npm run start            # Iniciar producción
```

## 📚 Documentación

### Multi-Tenant (NUEVO)
- `RESUMEN_MULTI_TENANT.md` - Resumen ejecutivo
- `SETUP_MULTI_TENANT.md` - Guía rápida
- `PROBAR_MULTI_TENANT.md` - Cómo probar
- `MULTI_TENANT_WHATSAPP.md` - Documentación completa
- `MIGRACION_A_MULTI_TENANT.md` - Migrar desde sistema antiguo
- `IMPLEMENTACION_MULTI_TENANT_COMPLETA.md` - Cambios técnicos

### Backend
- `server/README.md` - Documentación general
- `server/INSTALACION.md` - Guía de instalación
- `server/PRODUCCION.md` - Deploy a producción
- `server/ESTRUCTURA.md` - Estructura del código
- `server/CONFIGURACION_EMAILS.md` - Configuración de emails
- `server/SEGURIDAD_Y_BACKUPS.md` - Seguridad y backups
- `server/GUIA_SUPABASE.md` - Configuración de Supabase

### Sistema
- `SISTEMA_AUDITORIA_IMPLEMENTADO.md` - Sistema de auditoría
- `SISTEMA_COMPLETO_LISTO.md` - Estado completo del sistema

## 🌐 URLs

### Desarrollo
- Backend: http://localhost:8001
- Sistema Admin: http://localhost:3000
- Landing: http://localhost:3001

### Producción
Configurar en variables de entorno de cada servicio.

## 🔧 Tecnologías

### Backend
- Node.js + Express
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Nodemailer (emails)
- WhatsApp Web.js (opcional)

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/ui
- Recharts (gráficos)

## 📊 Performance

- ✅ Optimizado para 10+ usuarios simultáneos
- ✅ Índices en todas las tablas críticas
- ✅ Queries optimizadas
- ✅ Paginación en todas las listas
- ✅ Caché de datos frecuentes

## 🔒 Seguridad

- ✅ JWT con expiración
- ✅ Contraseñas hasheadas (bcrypt)
- ✅ Validación de inputs
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ SQL injection protegido
- ✅ XSS protegido
- ✅ Auditoría completa

## 📱 Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge (últimas 2 versiones)
- ✅ Responsive (Desktop, Tablet, Mobile)
- ✅ Touch-friendly

## 🚀 Deploy

### Backend (Railway/Render)
1. Conectar repositorio
2. Configurar variables de entorno
3. Ejecutar migraciones
4. Deploy automático

### Frontend (Vercel/Netlify)
1. Conectar repositorio
2. Configurar variables de entorno
3. Build automático
4. Deploy automático

Ver `server/PRODUCCION.md` para más detalles.

## 🐛 Troubleshooting

### Error al activar cuenta
- Verificar `NEXT_PUBLIC_API_URL` en `.env.local`
- Debe apuntar a `http://localhost:8001` en desarrollo

### No aparece el nombre del negocio
- Completar el wizard de onboarding

### No veo el menú "Historial"
- Solo ADMIN puede verlo

### No se calculan las ganancias
- Ingresar el costo de los productos

## 📞 Soporte

Para problemas o consultas, revisar la documentación en las carpetas correspondientes.

## 📄 Licencia

Propietario - Todos los derechos reservados

---

**Estado:** ✅ 100% Funcional  
**Última actualización:** Enero 2026
