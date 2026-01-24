# 🚀 Guía de Deploy en Vercel

## 📋 Resumen

Tenés que crear **2 proyectos** en Vercel:
1. **Sistema (Frontend)** → `app.mundoaple.store`
2. **Landing** → `www.mundoaple.store`

---

## 🔧 PASO 1: Deploy del Sistema (Frontend)

### 1.1 Crear proyecto en Vercel

1. Andá a [vercel.com](https://vercel.com) y logueate
2. Click en **"Add New..."** → **"Project"**
3. Seleccioná tu repo: `mundoiahelp-code/sistema-gestion-completo`
4. Click en **"Import"**

### 1.2 Configurar el proyecto

En la pantalla de configuración:

**Framework Preset:** Next.js (se detecta automáticamente)

**Root Directory:** 
- Click en **"Edit"**
- Seleccioná la carpeta **`sistema`**
- ✅ Confirmar

**Build and Output Settings:**
- Build Command: `npm run build` (default)
- Output Directory: `.next` (default)
- Install Command: `npm install` (default)

### 1.3 Variables de entorno

Click en **"Environment Variables"** y agregá:

```
NEXT_PUBLIC_API_URL=https://sistema-gestion-completo-production-08bc.up.railway.app/api
```

### 1.4 Deploy

1. Click en **"Deploy"**
2. Esperá 2-3 minutos a que termine
3. ✅ El sistema estará en una URL temporal de Vercel

### 1.5 Configurar dominio personalizado

1. Andá a **Settings** → **Domains**
2. Agregá el dominio: `app.mundoaple.store`
3. Seguí las instrucciones para configurar el DNS en tu proveedor de dominios
4. Esperá a que se verifique (puede tardar unos minutos)

---

## 🎨 PASO 2: Deploy del Landing

### 2.1 Crear proyecto en Vercel

1. En Vercel, click en **"Add New..."** → **"Project"**
2. Seleccioná el **mismo repo**: `mundoiahelp-code/sistema-gestion-completo`
3. Click en **"Import"**

### 2.2 Configurar el proyecto

**Framework Preset:** Next.js

**Root Directory:** 
- Click en **"Edit"**
- Seleccioná la carpeta **`landing`**
- ✅ Confirmar

**Build and Output Settings:**
- Build Command: `npm run build` (default)
- Output Directory: `.next` (default)
- Install Command: `npm install` (default)

### 2.3 Variables de entorno

Click en **"Environment Variables"** y agregá:

```
NEXT_PUBLIC_API_URL=https://sistema-gestion-completo-production-08bc.up.railway.app/api
NEXT_PUBLIC_SISTEMA_URL=https://app.mundoaple.store
```

### 2.4 Deploy

1. Click en **"Deploy"**
2. Esperá 2-3 minutos
3. ✅ El landing estará en una URL temporal de Vercel

### 2.5 Configurar dominio personalizado

1. Andá a **Settings** → **Domains**
2. Agregá el dominio: `www.mundoaple.store`
3. También agregá: `mundoaple.store` (sin www) y configuralo para que redirija a www
4. Seguí las instrucciones DNS
5. Esperá a que se verifique

---

## 🌐 PASO 3: Configurar DNS

En tu proveedor de dominios (donde compraste `mundoaple.store`), agregá estos registros DNS:

### Para el Landing (www.mundoaple.store):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Para el Sistema (app.mundoaple.store):
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

### Para el dominio raíz (mundoaple.store):
```
Type: A
Name: @
Value: 76.76.21.21
```

**Nota:** Los valores exactos te los va a dar Vercel cuando agregues los dominios.

---

## ✅ PASO 4: Verificar que todo funcione

### 4.1 Verificar el Backend
```bash
curl https://sistema-gestion-completo-production-08bc.up.railway.app/api/health
```
Debería responder: `{"status":"ok","message":"Server running"}`

### 4.2 Verificar el Sistema
1. Andá a `https://app.mundoaple.store`
2. Deberías ver la pantalla de login
3. Probá loguearte con:
   - Email: `mundoia.help@gmail.com`
   - Password: `Lauti10b12RR!!`

### 4.3 Verificar el Landing
1. Andá a `https://www.mundoaple.store`
2. Deberías ver la landing page
3. Los botones de "Acceder al Sistema" deberían llevarte a `app.mundoaple.store`

---

## 🔄 Actualizar después de cambios

Cuando hagas cambios en el código:

1. **Hacer commit y push a GitHub:**
   ```bash
   git add .
   git commit -m "Descripción del cambio"
   git push origin main
   ```

2. **Vercel detecta automáticamente** el push y hace un nuevo deploy
3. En 2-3 minutos los cambios estarán en producción

---

## 🐛 Troubleshooting

### Error: "Module not found"
- Verificá que el Root Directory esté bien configurado (`sistema` o `landing`)
- Verificá que las dependencias estén en el `package.json`

### Error: "API calls failing"
- Verificá que `NEXT_PUBLIC_API_URL` esté bien configurada
- Verificá que el backend en Railway esté corriendo

### Error: "Domain not working"
- Esperá 10-15 minutos para que el DNS se propague
- Verificá los registros DNS en tu proveedor

### Error de CORS
- Verificá que en Railway tengas configurado:
  ```
  CORS_ORIGIN=https://app.mundoaple.store,https://www.mundoaple.store
  FRONTEND_URL=https://app.mundoaple.store
  LANDING_URL=https://www.mundoaple.store
  ```

---

## 📝 Resumen de URLs

| Servicio | URL | Estado |
|----------|-----|--------|
| Backend API | https://sistema-gestion-completo-production-08bc.up.railway.app | ✅ Online |
| Sistema (Frontend) | https://app.mundoaple.store | ⏳ Por deployar |
| Landing | https://www.mundoaple.store | ⏳ Por deployar |
| Base de Datos | Supabase PostgreSQL | ✅ Online |

---

## 🎉 ¡Listo!

Una vez que termines estos pasos, tu sistema completo estará en producción:
- ✅ Backend en Railway
- ✅ Base de datos en Supabase
- ✅ Frontend en Vercel
- ✅ Landing en Vercel
- ✅ Dominios personalizados configurados

**Credenciales de acceso:**
- Email: `mundoia.help@gmail.com`
- Password: `Lauti10b12RR!!`
