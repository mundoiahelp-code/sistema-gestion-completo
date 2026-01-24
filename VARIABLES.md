# 📋 Variables de Entorno - Copy & Paste

## 🔴 RAILWAY (Backend)

```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
JWT_SECRET=8kN9mP2xQ7vR4wT6yU3zA1bC5dE8fG0hJ2kL4nM7pQ9rS1tV3xW6yZ8aB0cD2eF5
NODE_ENV=production
PORT=8002
FRONTEND_URL=https://app.mundoaple.store
LANDING_URL=https://www.mundoaple.store
CORS_ORIGIN=https://app.mundoaple.store,https://www.mundoaple.store
```

**⚠️ IMPORTANTE**: Reemplazar `DATABASE_URL` con tu URL real de Supabase

---

## 🟢 VERCEL - Sistema (app.mundoaple.store)

```env
NEXT_PUBLIC_API_URL=https://[TU-BACKEND].up.railway.app/api
```

**⚠️ IMPORTANTE**: Reemplazar `[TU-BACKEND]` con tu URL real de Railway

---

## 🔵 VERCEL - Landing (www.mundoaple.store)

```env
NEXT_PUBLIC_API_URL=https://[TU-BACKEND].up.railway.app/api
NEXT_PUBLIC_SISTEMA_URL=https://app.mundoaple.store
```

**⚠️ IMPORTANTE**: Reemplazar `[TU-BACKEND]` con tu URL real de Railway

---

## 📝 Ejemplo Completo

Si tu backend en Railway es: `sistema-gestion-production.up.railway.app`

### Railway
```env
DATABASE_URL=postgresql://postgres.abc123:mipassword@aws-0-us-west-2.pooler.supabase.com:5432/postgres
JWT_SECRET=8kN9mP2xQ7vR4wT6yU3zA1bC5dE8fG0hJ2kL4nM7pQ9rS1tV3xW6yZ8aB0cD2eF5
NODE_ENV=production
PORT=8002
FRONTEND_URL=https://app.mundoaple.store
LANDING_URL=https://www.mundoaple.store
CORS_ORIGIN=https://app.mundoaple.store,https://www.mundoaple.store
```

### Vercel Sistema
```env
NEXT_PUBLIC_API_URL=https://sistema-gestion-production.up.railway.app/api
```

### Vercel Landing
```env
NEXT_PUBLIC_API_URL=https://sistema-gestion-production.up.railway.app/api
NEXT_PUBLIC_SISTEMA_URL=https://app.mundoaple.store
```

---

## 🔐 Credenciales Admin

```
Email: mundoia.help@gmail.com
Password: Lauti10b12RR!!
```

---

## ✅ Checklist

- [ ] Copiar variables a Railway
- [ ] Copiar variables a Vercel (Sistema)
- [ ] Copiar variables a Vercel (Landing)
- [ ] Ejecutar `node init-production-db.js` en Railway
- [ ] Probar login en https://app.mundoaple.store
