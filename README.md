# 🏪 Sistema de Gestión Completo

Sistema completo de gestión para tiendas con frontend, backend y landing page.

## 📦 Estructura del Proyecto

```
sistema-gestion-completo/
├── server/          # Backend API (Node.js + Express + Prisma)
├── sistema/         # Frontend Admin (Next.js 14)
├── landing/         # Landing Page (Next.js 14)
├── DEPLOY-GUIDE.md  # Guía completa de deployment
└── README.md        # Este archivo
```

## 🚀 Deploy Rápido

### Producción (Supabase + Railway + Vercel)

1. **Leer la guía completa**: [DEPLOY-GUIDE.md](./DEPLOY-GUIDE.md)
2. **Crear base de datos en Supabase**
3. **Deploy backend en Railway**
4. **Deploy frontends en Vercel**
5. **Crear usuario admin**

Todo el proceso está explicado paso a paso en la guía.

## 💻 Desarrollo Local

### Requisitos
- Node.js 18+
- PostgreSQL (local o Supabase)
- npm o yarn

### 1. Clonar repositorio
```bash
git clone https://github.com/tu-usuario/sistema-gestion-completo.git
cd sistema-gestion-completo
```

### 2. Configurar Backend
```bash
cd server
npm install
cp .env.example .env
# Editar .env con tu configuración
npx prisma migrate dev
node init-production-db.js
npm run dev
```

### 3. Configurar Sistema (Frontend)
```bash
cd sistema
npm install
cp .env.example .env.local
# Editar .env.local
npm run dev
```

### 4. Configurar Landing
```bash
cd landing
npm install
cp .env.example .env.local
# Editar .env.local
npm run dev
```

### Acceder
- **Sistema**: http://localhost:3000
- **Landing**: http://localhost:3001
- **API**: http://localhost:8002

### Credenciales por defecto
```
Email: mundoia.help@gmail.com
Password: Lauti10b12RR!!
```

## 🛠️ Stack Tecnológico

### Backend
- Node.js 18
- Express
- Prisma ORM
- PostgreSQL
- JWT Authentication
- TypeScript

### Frontend (Sistema)
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Shadcn/ui

### Frontend (Landing)
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

## 📚 Documentación

- [Guía de Deploy](./DEPLOY-GUIDE.md) - Deployment completo a producción
- [Backend README](./server/README.md) - Documentación del backend
- [Sistema README](./sistema/README.md) - Documentación del frontend admin
- [Landing README](./landing/README.md) - Documentación de la landing

## 🔒 Seguridad

- Autenticación JWT
- Passwords hasheados con bcrypt
- CORS configurado
- Rate limiting
- Helmet para headers de seguridad
- Variables de entorno para secretos

## 📝 Variables de Entorno

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=tu-secret-aqui
PORT=8002
FRONTEND_URL=http://localhost:3000
LANDING_URL=http://localhost:3001
NODE_ENV=development
```

### Sistema (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8002/api
```

### Landing (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8002/api
NEXT_PUBLIC_SISTEMA_URL=http://localhost:3000
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es privado y propietario.

## 👤 Autor

**Mundo Apple**
- Email: mundoia.help@gmail.com
- Website: https://www.mundoaple.store

## 🆘 Soporte

Si tienes problemas:
1. Revisar [DEPLOY-GUIDE.md](./DEPLOY-GUIDE.md)
2. Revisar logs del servidor
3. Revisar consola del navegador (F12)
4. Contactar al equipo de desarrollo

---

**¿Listo para deployar?** Lee la [Guía de Deploy](./DEPLOY-GUIDE.md) 🚀
