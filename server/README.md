# Backend Sistema de Gestión

Backend moderno construido con Node.js, Express, TypeScript, Prisma y PostgreSQL.

## 🚀 Características

- **TypeScript** para seguridad de tipos
- **Prisma ORM** para manejo de base de datos
- **JWT** para autenticación
- **Zod** para validación de datos
- **Express** framework rápido y minimalista
- **PostgreSQL** base de datos robusta

## 📦 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales de PostgreSQL:
```
DATABASE_URL="postgresql://usuario:password@localhost:5432/gestion_db"
JWT_SECRET="tu-secreto-super-seguro"
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

3. Crear base de datos y ejecutar migraciones:
```bash
npm run prisma:migrate
```

4. Generar cliente de Prisma:
```bash
npm run prisma:generate
```

## 🏃 Ejecutar

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm run build
npm start
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/logout` - Cerrar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Usuarios
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario
- `POST /api/users` - Crear usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Tiendas
- `GET /api/stores` - Listar tiendas
- `GET /api/stores/:id` - Obtener tienda
- `POST /api/stores` - Crear tienda
- `PUT /api/stores/:id` - Actualizar tienda
- `DELETE /api/stores/:id` - Eliminar tienda

### Productos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto
- `POST /api/products` - Crear producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto

### Clientes
- `GET /api/clients` - Listar clientes
- `GET /api/clients/:id` - Obtener cliente
- `POST /api/clients` - Crear cliente
- `PUT /api/clients/:id` - Actualizar cliente
- `DELETE /api/clients/:id` - Eliminar cliente

### Ventas
- `GET /api/sales` - Listar ventas
- `GET /api/sales/:id` - Obtener venta
- `POST /api/sales` - Crear venta
- `PUT /api/sales/:id` - Actualizar venta
- `DELETE /api/sales/:id` - Eliminar venta

### Pedidos
- `GET /api/orders` - Listar pedidos
- `GET /api/orders/:id` - Obtener pedido
- `POST /api/orders` - Crear pedido
- `PUT /api/orders/:id` - Actualizar pedido
- `DELETE /api/orders/:id` - Eliminar pedido

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas del dashboard

## 🗄️ Base de Datos

El esquema incluye:
- **Users** - Usuarios del sistema
- **Stores** - Tiendas
- **Products** - Productos/Inventario
- **Clients** - Clientes
- **Sales** - Ventas realizadas
- **SaleItems** - Items de cada venta
- **Orders** - Pedidos
- **OrderItems** - Items de cada pedido

## 🔐 Roles

- **ADMIN** - Acceso total
- **MANAGER** - Gestión de tienda
- **SELLER** - Ventas y pedidos

## 🛠️ Scripts Útiles

- `npm run dev` - Modo desarrollo con hot reload
- `npm run build` - Compilar TypeScript
- `npm start` - Ejecutar en producción
- `npm run prisma:studio` - Abrir Prisma Studio (GUI para DB)
- `npm run prisma:migrate` - Crear migración
- `npm run prisma:generate` - Generar cliente Prisma
