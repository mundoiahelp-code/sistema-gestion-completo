# 🚀 Guía de Deploy - Sistema de Gestión

## 📋 Requisitos Previos

- Cuenta en [Supabase](https://supabase.com) (base de datos)
- Cuenta en [Railway](https://railway.app) (backend)
- Cuenta en [Vercel](https://vercel.com) (frontend)
- Dominios configurados en Vercel

---

## 1️⃣ SUPABASE - Base de Datos PostgreSQL

### Crear Proyecto
1. Ir a https://supabase.com/dashboard
2. Click en "New Project"
3. Configurar:
   - **Name**: `mundoaple-db`
   - **Database Password**: Guardar en lugar seguro
   - **Region**: `US West (Oregon)` o el más cercano
4. Esperar a que se cree el proyecto (2-3 minutos)

### Obtener Connection String
1. En el proyecto, ir a **Settings** → **Database**
2. Buscar **Connection string** → **URI**
3. Copiar la URL que se ve así:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
   ```
4. Reemplazar `[PASSWORD]` con tu contraseña real

### Configurar Base de Datos
1. Ir a **SQL Editor**
2. La base de datos está lista (Railway ejecutará las migraciones automáticamente)

---

## 2️⃣ RAILWAY - Backend API

### Crear Servicio
1. Ir a https://railway.app/new
2. Click en "Deploy from GitHub repo"
3. Conectar tu repositorio
4. Seleccionar el repositorio `sistema-gestion-completo`
5. Click en "Deploy Now"

### Configurar Variables de Entorno
1. En el servicio, ir a **Variables**
2. Agregar estas variables:

```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
JWT_SECRET=8kN9mP2xQ7vR4wT6yU3zA1bC5dE8fG0hJ2kL4nM7pQ9rS1tV3xW6yZ8aB0cD2eF5
NODE_ENV=production
PORT=8002
FRONTEND_URL=https://app.mundoaple.store
LANDING_URL=https://www.mundoaple.store
CORS_ORIGIN=https://app.mundoaple.store,https://www.mundoaple.store
```

**IMPORTANTE**: Reemplazar `DATABASE_URL` con tu URL real de Supabase

### Configurar Root Directory
1. En **Settings** → **Build**
2. Cambiar **Root Directory** a: `server`
3. **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
4. **Start Command**: `node dist/index.js`
5. Guardar cambios

### Obtener URL del Backend
1. En **Settings** → **Domains**
2. Copiar la URL (ejemplo: `sistema-gestion-production.up.railway.app`)
3. Guardar para usar en Vercel

---

## 3️⃣ VERCEL - Frontend Sistema

### Deploy Sistema (App Principal)
1. Ir a https://vercel.com/new
2. Importar repositorio
3. Configurar:
   - **Framework Preset**: Next.js
   - **Root Directory**: `sistema`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Variables de Entorno
```env
NEXT_PUBLIC_API_URL=https://[TU-BACKEND-RAILWAY].up.railway.app/api
```

### Configurar Dominio
1. En **Settings** → **Domains**
2. Agregar dominio: `app.mundoaple.store`
3. Configurar DNS según instrucciones de Vercel

---

## 4️⃣ VERCEL - Landing Page

### Deploy Landing
1. Ir a https://vercel.com/new
2. Importar el mismo repositorio
3. Configurar:
   - **Framework Preset**: Next.js
   - **Root Directory**: `landing`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Variables de Entorno
```env
NEXT_PUBLIC_API_URL=https://[TU-BACKEND-RAILWAY].up.railway.app/api
NEXT_PUBLIC_SISTEMA_URL=https://app.mundoaple.store
```

### Configurar Dominio
1. En **Settings** → **Domains**
2. Agregar dominio: `www.mundoaple.store`
3. Configurar DNS según instrucciones de Vercel

---

## 5️⃣ CREAR USUARIO ADMINISTRADOR

### Opción A: Desde Railway (Recomendado)
1. En Railway, ir a tu servicio
2. Click en **Deployments** → último deployment exitoso
3. Click en **View Logs**
4. Abrir **Shell** (terminal)
5. Ejecutar:
```bash
node create-new-admin.js
```

### Opción B: Desde Local
1. Abrir terminal en carpeta `server`
2. Configurar `.env` con la URL de Supabase:
```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
```
3. Ejecutar:
```bash
node create-new-admin.js
```

### Credenciales por Defecto
```
Email: mundoia.help@gmail.com
Password: Lauti10b12RR!!
```

---

## 6️⃣ VERIFICAR DEPLOYMENT

### Checklist Final
- [ ] Backend responde en: `https://[backend].up.railway.app/api/health`
- [ ] Sistema carga en: `https://app.mundoaple.store`
- [ ] Landing carga en: `https://www.mundoaple.store`
- [ ] Login funciona con las credenciales
- [ ] No hay errores de CORS en consola (F12)
- [ ] Base de datos tiene tablas creadas

### Probar Login
1. Ir a `https://app.mundoaple.store`
2. Ingresar:
   - Email: `mundoia.help@gmail.com`
   - Password: `Lauti10b12RR!!`
3. Debería entrar al dashboard

---

## 🔧 TROUBLESHOOTING

### Error: "Cannot connect to database"
- Verificar que `DATABASE_URL` en Railway sea correcta
- Verificar que la contraseña no tenga caracteres especiales sin escapar
- Probar conexión desde Supabase SQL Editor

### Error: "CORS policy"
- Verificar que `CORS_ORIGIN` en Railway incluya ambos dominios
- Verificar que `FRONTEND_URL` y `LANDING_URL` sean correctos
- Hacer redeploy del backend después de cambiar variables

### Error: "Failed to fetch"
- Verificar que `NEXT_PUBLIC_API_URL` en Vercel sea correcto
- Verificar que el backend esté online en Railway
- Verificar que la URL termine en `/api`

### Error: "Invalid credentials"
- Ejecutar `create-new-admin.js` nuevamente
- Verificar que la base de datos tenga el usuario creado
- Revisar logs de Railway para ver errores

---

## 📝 NOTAS IMPORTANTES

1. **JWT_SECRET**: Usar uno diferente en producción (generado aleatoriamente)
2. **Passwords**: Cambiar contraseñas por defecto después del primer login
3. **Backups**: Supabase hace backups automáticos, pero considera backups adicionales
4. **Logs**: Railway guarda logs por 7 días, revisar regularmente
5. **Costos**: 
   - Supabase: Free tier hasta 500MB
   - Railway: $5/mes por servicio
   - Vercel: Free tier para proyectos personales

---

## 🎉 ¡LISTO!

Tu sistema está deployado y funcionando. Ahora puedes:
- Acceder al sistema en `https://app.mundoaple.store`
- Configurar tu tienda
- Agregar productos
- Gestionar ventas

**¿Problemas?** Revisar logs en Railway y consola del navegador (F12)
