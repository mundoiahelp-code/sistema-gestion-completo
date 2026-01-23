# ✅ Checklist Rápido de Deploy

## Antes de Empezar

- [ ] Código subido a GitHub
- [ ] Cuenta en Vercel creada
- [ ] Cuenta en Railway creada
- [ ] API Key de Anthropic (opcional, para chatbot)

---

## 🗄️ Railway - Base de Datos (5 min)

1. [ ] Ir a https://railway.app
2. [ ] New Project → Provision PostgreSQL
3. [ ] Copiar `DATABASE_URL` (la vas a necesitar)

---

## 🖥️ Railway - Backend (10 min)

1. [ ] En el mismo proyecto: New → GitHub Repo
2. [ ] Seleccionar carpeta `server`
3. [ ] Agregar variables de entorno:
   ```
   DATABASE_URL=postgresql://... (la que copiaste)
   JWT_SECRET=cambiar-esto-por-algo-super-seguro-123456789
   JWT_EXPIRES_IN=7d
   PORT=8002
   ANTHROPIC_API_KEY=tu-api-key (opcional)
   NODE_ENV=production
   ```
4. [ ] Deploy
5. [ ] Copiar URL del backend (ej: `https://xxx.up.railway.app`)

---

## 🌐 Vercel - Sistema (5 min)

1. [ ] Ir a https://vercel.com
2. [ ] Add New → Project → Import tu repo
3. [ ] Root Directory: `sistema`
4. [ ] Framework: Next.js (auto-detectado)
5. [ ] Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://tu-backend.up.railway.app/api
   ```
6. [ ] Deploy
7. [ ] Copiar URL del sistema (ej: `https://xxx.vercel.app`)

---

## 🎨 Vercel - Landing (5 min)

1. [ ] Add New → Project → Import el mismo repo
2. [ ] Root Directory: `landing`
3. [ ] Framework: Next.js (auto-detectado)
4. [ ] Deploy
5. [ ] Copiar URL de landing

---

## 🔄 Actualizar URLs Cruzadas (2 min)

### En Railway (Backend):
1. [ ] Agregar variable: `FRONTEND_URL=https://tu-sistema.vercel.app`
2. [ ] Redeploy

---

## 👤 Crear Usuario Admin (5 min)

### Opción A: Desde Railway Dashboard

1. [ ] Railway → PostgreSQL → Data → Query
2. [ ] Ejecutar:

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

-- Crear usuario admin
-- Email: admin@tunegocio.com
-- Password: admin123 (CAMBIAR DESPUÉS!)
INSERT INTO "User" (id, email, password, name, role, "tenantId", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@tunegocio.com',
  '$2a$10$YourHashedPasswordHere',
  'Administrador',
  'ADMIN',
  (SELECT id FROM "Tenant" LIMIT 1),
  NOW(),
  NOW()
);
```

### Opción B: Usar el script setup-superadmin.js

1. [ ] Conectarte a Railway con Railway CLI
2. [ ] Ejecutar: `railway run node setup-superadmin.js`

---

## ✅ Verificación Final

1. [ ] Abrir `https://tu-sistema.vercel.app`
2. [ ] Iniciar sesión con el usuario admin
3. [ ] Verificar que cargue el dashboard
4. [ ] Probar crear un producto
5. [ ] Verificar que todo funcione

---

## 🎉 ¡Listo!

Tu sistema está en producción. URLs finales:

- **Landing**: https://tu-landing.vercel.app
- **Sistema**: https://tu-sistema.vercel.app  
- **Backend**: https://tu-backend.up.railway.app

---

## 🔧 Si algo falla:

### Backend no responde:
- Revisar logs en Railway
- Verificar que DATABASE_URL esté correcta
- Verificar que las migraciones se ejecutaron

### Frontend no carga:
- Revisar logs en Vercel
- Verificar NEXT_PUBLIC_API_URL
- Verificar CORS en el backend

### No puedo iniciar sesión:
- Verificar que el usuario se creó en la DB
- Verificar JWT_SECRET en el backend
- Revisar logs del backend

---

## 📞 Comandos Útiles

```bash
# Ver logs del backend
railway logs

# Conectarse a la DB
railway connect

# Redeploy
railway up

# Ver variables de entorno
railway variables
```
