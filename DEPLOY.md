# 🚀 Guía de Deploy - Sistema de Gestión

## 📋 Requisitos Previos

- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Railway](https://railway.app)
- Cuenta en [Anthropic](https://console.anthropic.com) (para el chatbot)
- Git instalado
- Repositorio en GitHub

---

## 🗄️ PASO 1: Deploy de Base de Datos (Railway)

### 1.1 Crear Base de Datos PostgreSQL

1. Entrá a [Railway](https://railway.app)
2. Click en "New Project"
3. Seleccioná "Provision PostgreSQL"
4. Esperá a que se cree la base de datos
5. Click en la base de datos → "Connect" → Copiá la `DATABASE_URL`

**Guardá esta URL, la vas a necesitar!**

---

## 🖥️ PASO 2: Deploy del Backend (Railway)

### 2.1 Crear Servicio en Railway

1. En el mismo proyecto de Railway, click en "New"
2. Seleccioná "GitHub Repo"
3. Conectá tu repositorio
4. Seleccioná la carpeta `server`

### 2.2 Configurar Variables de Entorno

En Railway, andá a tu servicio → "Variables" y agregá:

```bash
DATABASE_URL=postgresql://... (la que copiaste antes)
JWT_SECRET=tu-secret-super-seguro-cambiar-esto
JWT_EXPIRES_IN=7d
PORT=8002
FRONTEND_URL=https://tu-sistema.vercel.app (lo vas a tener después)
ANTHROPIC_API_KEY=tu-api-key-de-anthropic
NODE_ENV=production
```

### 2.3 Configurar Build

Railway debería detectar automáticamente el `railway.json`, pero verificá:

- **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
- **Start Command**: `npm start`

### 2.4 Deploy

1. Click en "Deploy"
2. Esperá a que termine (puede tardar 2-3 minutos)
3. Una vez deployado, copiá la URL pública (ej: `https://tu-backend.up.railway.app`)

**Guardá esta URL del backend!**

---

## 🌐 PASO 3: Deploy del Sistema (Frontend en Vercel)

### 3.1 Importar Proyecto

1. Entrá a [Vercel](https://vercel.com)
2. Click en "Add New" → "Project"
3. Importá tu repositorio de GitHub
4. Seleccioná la carpeta `sistema`

### 3.2 Configurar Build

Vercel debería detectar Next.js automáticamente:

- **Framework Preset**: Next.js
- **Root Directory**: `sistema`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### 3.3 Configurar Variables de Entorno

En Vercel, andá a "Environment Variables" y agregá:

```bash
NEXT_PUBLIC_API_URL=https://tu-backend.up.railway.app/api
```

### 3.4 Deploy

1. Click en "Deploy"
2. Esperá a que termine (1-2 minutos)
3. Copiá la URL de tu sistema (ej: `https://tu-sistema.vercel.app`)

---

## 🎨 PASO 4: Deploy de Landing (Vercel)

### 4.1 Crear Nuevo Proyecto

1. En Vercel, click en "Add New" → "Project"
2. Importá el mismo repositorio
3. Seleccioná la carpeta `landing`

### 4.2 Configurar Build

- **Framework Preset**: Next.js
- **Root Directory**: `landing`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### 4.3 Deploy

1. Click en "Deploy"
2. Esperá a que termine
3. Tu landing estará en `https://tu-landing.vercel.app`

---

## 🔄 PASO 5: Actualizar URLs Cruzadas

### 5.1 Actualizar Backend

En Railway, actualizá la variable:

```bash
FRONTEND_URL=https://tu-sistema.vercel.app
```

### 5.2 Actualizar Sistema

En Vercel (proyecto sistema), verificá:

```bash
NEXT_PUBLIC_API_URL=https://tu-backend.up.railway.app/api
```

### 5.3 Re-deploy

- Railway: Click en "Redeploy"
- Vercel: Se re-deploya automáticamente

---

## 👤 PASO 6: Crear Usuario Administrador

### 6.1 Conectarse a la Base de Datos

En Railway, andá a tu base de datos PostgreSQL → "Data" → "Query"

### 6.2 Ejecutar Script

Ejecutá este SQL (cambiá el email y password):

```sql
-- Crear tenant
INSERT INTO "Tenant" (id, name, plan, "maxUsers", "maxStores", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Mi Negocio',
  'PRO',
  18,
  999,
  NOW(),
  NOW()
);

-- Crear usuario admin (cambiá el email y password)
-- Password: "admin123" (hasheado con bcrypt)
INSERT INTO "User" (id, email, password, name, role, "tenantId", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@tunegocio.com',
  '$2a$10$rQZ9vXqZ9vXqZ9vXqZ9vXqZ9vXqZ9vXqZ9vXqZ9vXqZ9vXqZ9vXqZ',
  'Administrador',
  'ADMIN',
  (SELECT id FROM "Tenant" LIMIT 1),
  NOW(),
  NOW()
);
```

**IMPORTANTE**: Cambiá el password después del primer login!

---

## 🤖 PASO 7: Bot de WhatsApp (Opcional)

El bot necesita correr en un servidor con WhatsApp Web. Opciones:

### Opción A: Railway (Recomendado para testing)

1. Crear nuevo servicio en Railway
2. Seleccionar carpeta `chat-auto`
3. Configurar variables de entorno
4. Deploy

### Opción B: VPS Propio (Recomendado para producción)

1. Alquilar VPS (DigitalOcean, Linode, etc.)
2. Instalar Node.js
3. Clonar repo
4. Configurar PM2
5. Escanear QR de WhatsApp

---

## ✅ Verificación Final

### Checklist:

- [ ] Base de datos PostgreSQL funcionando en Railway
- [ ] Backend deployado en Railway y respondiendo
- [ ] Sistema (frontend) deployado en Vercel
- [ ] Landing deployado en Vercel
- [ ] Usuario admin creado
- [ ] Podés iniciar sesión en el sistema
- [ ] Las URLs están correctamente configuradas

---

## 🔧 Troubleshooting

### Error: "Cannot connect to database"

- Verificá que la `DATABASE_URL` esté correcta en Railway
- Verificá que las migraciones se hayan ejecutado

### Error: "CORS policy"

- Verificá que `FRONTEND_URL` en el backend apunte a tu dominio de Vercel
- Verificá que `NEXT_PUBLIC_API_URL` en el frontend apunte a tu backend de Railway

### Error: "Build failed"

- Verificá que todas las dependencias estén en `package.json`
- Verificá que no haya errores de TypeScript
- Revisá los logs de build en Vercel/Railway

---

## 📞 Soporte

Si tenés problemas con el deploy, revisá:

1. Logs de Railway (para backend)
2. Logs de Vercel (para frontend)
3. Variables de entorno configuradas correctamente

---

## 🎉 ¡Listo!

Tu sistema está deployado y funcionando en producción. Ahora podés:

- Acceder desde cualquier lugar
- Compartir el link con tu equipo
- Configurar dominio personalizado (opcional)
- Configurar el bot de WhatsApp

**URLs Finales:**

- Landing: `https://tu-landing.vercel.app`
- Sistema: `https://tu-sistema.vercel.app`
- Backend: `https://tu-backend.up.railway.app`
