# ⚡ Quick Start - Deploy en 10 Minutos

## 1️⃣ SUPABASE (2 min)

1. Ir a https://supabase.com/dashboard
2. New Project → `mundoaple-db`
3. Copiar **Connection String** (URI)
4. Guardar para Railway

## 2️⃣ RAILWAY (3 min)

1. Ir a https://railway.app/new
2. Deploy from GitHub → tu repo
3. **Settings** → **Build**:
   - Root Directory: `server`
4. **Variables**:
```
DATABASE_URL=tu-url-de-supabase-aqui
JWT_SECRET=8kN9mP2xQ7vR4wT6yU3zA1bC5dE8fG0hJ2kL4nM7pQ9rS1tV3xW6yZ8aB0cD2eF5
NODE_ENV=production
PORT=8002
FRONTEND_URL=https://app.mundoaple.store
LANDING_URL=https://www.mundoaple.store
CORS_ORIGIN=https://app.mundoaple.store,https://www.mundoaple.store
```
5. Copiar URL del backend (ej: `xxx.up.railway.app`)

## 3️⃣ VERCEL - SISTEMA (2 min)

1. Ir a https://vercel.com/new
2. Import repo → Root: `sistema`
3. **Environment Variables**:
```
NEXT_PUBLIC_API_URL=https://tu-backend.up.railway.app/api
```
4. Deploy
5. **Settings** → **Domains** → `app.mundoaple.store`

## 4️⃣ VERCEL - LANDING (2 min)

1. Vercel → New Project → mismo repo
2. Root: `landing`
3. **Environment Variables**:
```
NEXT_PUBLIC_API_URL=https://tu-backend.up.railway.app/api
NEXT_PUBLIC_SISTEMA_URL=https://app.mundoaple.store
```
4. Deploy
5. **Settings** → **Domains** → `www.mundoaple.store`

## 5️⃣ CREAR ADMIN (1 min)

En Railway:
1. **Deployments** → último deployment
2. **View Logs** → abrir **Shell**
3. Ejecutar:
```bash
node init-production-db.js
```

## ✅ LISTO!

**Login**: https://app.mundoaple.store

```
Email: mundoia.help@gmail.com
Password: Lauti10b12RR!!
```

---

## 🆘 Si algo falla:

1. **Backend no responde**: Revisar logs en Railway
2. **CORS error**: Verificar variables CORS_ORIGIN en Railway
3. **Cannot connect to database**: Verificar DATABASE_URL en Railway
4. **Login no funciona**: Ejecutar `node init-production-db.js` en Railway

**Guía completa**: [DEPLOY-GUIDE.md](./DEPLOY-GUIDE.md)
