# 🤖 Sistema Integrado: Chatbot WhatsApp + Gestión Web

Sistema completo de gestión con chatbot de WhatsApp integrado. El bot (Luminateia/Lumi) atiende clientes 24/7, agenda turnos, consulta stock y registra ventas automáticamente, todo sincronizado en tiempo real con el sistema web de gestión.

## ✨ Características Principales

### 🤖 Chatbot de WhatsApp (Lumi)
- ✅ Conversaciones naturales con IA (Anthropic Claude)
- ✅ Atención 24/7 sin intervención humana
- ✅ Agenda turnos automáticamente
- ✅ Consulta stock en tiempo real
- ✅ Registra ventas y actualiza stock
- ✅ Personalidad argentina y tono humano

### 💻 Sistema Web de Gestión
- ✅ Dashboard con métricas en tiempo real
- ✅ Gestión completa de turnos (nueva funcionalidad)
- ✅ Control de stock e inventario
- ✅ Registro de ventas y clientes
- ✅ Reportes y estadísticas
- ✅ Multi-tienda y multi-usuario

### 🔄 Integración en Tiempo Real
- ✅ Base de datos única (PostgreSQL)
- ✅ Sincronización automática
- ✅ API RESTful completa
- ✅ Autenticación JWT segura

## 🚀 Inicio Rápido

### 1. Instalación Automática

```bash
setup-integration.bat
```

### 2. Configurar Variables de Entorno

Editá los archivos `.env` en cada carpeta:

**Backend (`server/.env`):**
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/gestion_db"
JWT_SECRET="tu-secreto-super-seguro"
PORT=8000
```

**Chatbot (`chat-auto/.env`):**
```env
ANTHROPIC_API_KEY=tu_api_key_aqui
BACKEND_URL=http://localhost:8000/api
BACKEND_TOKEN=tu_jwt_token_aqui
USE_BACKEND=true
BOT_NAME=Lumi
```

**Frontend (`sistema/.env`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 3. Iniciar Servicios

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd sistema
npm run dev
```

**Terminal 3 - Chatbot:**
```bash
cd chat-auto
npm start
```

### 4. Escanear QR de WhatsApp

Escaneá el QR que aparece en la terminal del chatbot con WhatsApp.

### 5. ¡Listo!

- Sistema web: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Chatbot: Conectado a WhatsApp

## 📚 Documentación Completa

### 🎯 Para Empezar
- **[README_INTEGRACION.md](README_INTEGRACION.md)** - Guía de inicio rápido
- **[CHECKLIST_INSTALACION.md](CHECKLIST_INSTALACION.md)** - Checklist paso a paso
- **[COMANDOS_UTILES.md](COMANDOS_UTILES.md)** - Comandos útiles

### 📖 Documentación Técnica
- **[INTEGRACION_CHATBOT.md](INTEGRACION_CHATBOT.md)** - Guía técnica completa
- **[ARQUITECTURA_VISUAL.md](ARQUITECTURA_VISUAL.md)** - Diagramas y arquitectura
- **[RESUMEN_IMPLEMENTACION.md](RESUMEN_IMPLEMENTACION.md)** - Resumen ejecutivo

### ❓ Ayuda
- **[FAQ_INTEGRACION.md](FAQ_INTEGRACION.md)** - Preguntas frecuentes

### 📁 Documentación de Cada Proyecto
- **[chat-auto/README.md](chat-auto/README.md)** - Documentación del chatbot
- **[server/README.md](server/README.md)** - Documentación del backend
- **[sistema/README.md](sistema/README.md)** - Documentación del frontend

## 🎯 Casos de Uso

### Caso 1: Cliente Agenda Turno por WhatsApp

```
Cliente: Hola, quiero un turno para mañana a las 15hs
Lumi: Dale! Como te llamas?
Cliente: Juan
Lumi: Perfecto Juan! Te agendo para mañana a las 15hs 🙌
```

**Resultado:**
- Turno aparece instantáneamente en `/turnos` del sistema web
- Staff puede gestionar el turno (confirmar, completar, cancelar)
- Cliente recibe confirmación automática

### Caso 2: Cliente Consulta Stock

```
Cliente: Que iPhones tenes?
Lumi: Mira, tenemos estos modelos:

📱 iPhone 13 Pro 128GB Plata
   🔋 Batería: 95%
   ✨ Estado: Impecable
   💰 Precio: $85000
   📦 Stock: 2
```

**Resultado:**
- Bot consulta stock real del sistema
- Información siempre actualizada
- Cliente ve disponibilidad inmediata

### Caso 3: Cliente Realiza Compra

```
Cliente: Quiero el iPhone 13 Pro
Lumi: Joya! Te lo reservo. Como te llamas?
Cliente: María
Lumi: Perfecto María! Querés pasar a retirarlo hoy?
Cliente: Si, a las 18hs
Lumi: Dale! Te esperamos hoy a las 18hs 🙌
```

**Resultado:**
- Venta registrada automáticamente
- Stock actualizado (de 2 a 1)
- Turno de retiro agendado
- Todo visible en el sistema web

## 🏗️ Arquitectura

```
┌─────────────┐         ┌─────────────┐
│  WhatsApp   │         │  Navegador  │
│  Clientes   │         │    Staff    │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │ Mensajes              │ HTTPS
       │                       │
┌──────▼───────────────────────▼──────┐
│         CAPA DE APLICACIÓN          │
│  ┌──────────┐      ┌──────────┐    │
│  │ Chatbot  │      │ Frontend │    │
│  │  (Lumi)  │      │ Next.js  │    │
│  └────┬─────┘      └────┬─────┘    │
└───────┼─────────────────┼───────────┘
        │                 │
        │   HTTP API      │
        └────────┬────────┘
                 │
┌────────────────▼────────────────────┐
│         BACKEND API                 │
│    Express + TypeScript             │
│         Prisma ORM                  │
└────────────────┬────────────────────┘
                 │
                 │ SQL
                 │
┌────────────────▼────────────────────┐
│         PostgreSQL                  │
│    (Supabase o Local)               │
└─────────────────────────────────────┘
```

## 📦 Estructura del Proyecto

```
.
├── chat-auto/              # Chatbot de WhatsApp
│   ├── src/
│   │   ├── api/           # Cliente HTTP para backend
│   │   ├── adapters/      # Adaptadores (turnos, stock, ventas)
│   │   ├── ai/            # Integración con Anthropic
│   │   └── whatsapp/      # Cliente Baileys
│   └── package.json
│
├── server/                 # Backend API
│   ├── src/
│   │   ├── controllers/   # Lógica de negocio
│   │   ├── routes/        # Rutas HTTP
│   │   ├── middleware/    # Autenticación, validación
│   │   └── lib/           # Prisma client
│   ├── prisma/
│   │   └── schema.prisma  # Modelo de datos
│   └── package.json
│
├── sistema/                # Frontend Web
│   ├── src/
│   │   ├── app/
│   │   │   └── (app)/
│   │   │       ├── turnos/     # Nueva página de turnos
│   │   │       ├── productos/
│   │   │       ├── ventas/
│   │   │       └── ...
│   │   ├── components/
│   │   └── lib/
│   └── package.json
│
├── INTEGRACION_CHATBOT.md      # Guía técnica completa
├── README_INTEGRACION.md       # Guía de inicio rápido
├── CHECKLIST_INSTALACION.md    # Checklist paso a paso
├── COMANDOS_UTILES.md          # Comandos útiles
├── ARQUITECTURA_VISUAL.md      # Diagramas
├── FAQ_INTEGRACION.md          # Preguntas frecuentes
└── setup-integration.bat       # Script de instalación
```

## 🔧 Tecnologías

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Zod Validation

### Frontend
- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Axios

### Chatbot
- Baileys (WhatsApp)
- Anthropic Claude 3.5
- Node.js
- Axios

## 💰 Costos Estimados

### Desarrollo (Local)
- **Gratis** - Todo corre localmente

### Producción (Mensual)
- Backend (Railway/Render): $5-10
- Frontend (Vercel): Gratis
- Chatbot (VPS): $5-10
- Anthropic API: $10-50 (según uso)
- Supabase: Gratis hasta 500MB
- **Total: $20-70/mes**

## 🎯 Beneficios

### Para el Negocio
- ✅ Atención 24/7 sin personal adicional
- ✅ Turnos organizados automáticamente
- ✅ Stock siempre actualizado
- ✅ Menos errores humanos
- ✅ Mejor experiencia del cliente
- ✅ Datos centralizados

### Para el Staff
- ✅ Vista completa de turnos en tiempo real
- ✅ Gestión simple y rápida
- ✅ Menos trabajo manual
- ✅ Reportes automáticos
- ✅ Acceso desde cualquier dispositivo

### Técnicos
- ✅ Código modular y mantenible
- ✅ TypeScript para seguridad de tipos
- ✅ API RESTful bien documentada
- ✅ Base de datos robusta
- ✅ Escalable según necesidad

## 🚨 Requisitos

### Software
- Node.js 18+
- PostgreSQL (o cuenta de Supabase)
- Git
- WhatsApp Business o personal

### Cuentas
- Anthropic (Claude API)
- Supabase (opcional, para producción)

### Conocimientos
- Básicos de terminal/línea de comandos
- Configuración de variables de entorno
- Conceptos básicos de APIs

## 🐛 Troubleshooting

### El bot no responde
1. Verificá que esté conectado a WhatsApp
2. Verificá que el backend esté corriendo
3. Revisá los logs del bot

### Los turnos no aparecen
1. Verificá `USE_BACKEND=true` en `chat-auto/.env`
2. Verificá que el token JWT sea válido
3. Revisá los logs del backend

### Error 401 Unauthorized
1. Regenerá el token JWT
2. Actualizá `BACKEND_TOKEN` en `chat-auto/.env`
3. Reiniciá el bot

**Ver [FAQ_INTEGRACION.md](FAQ_INTEGRACION.md) para más problemas comunes.**

## 📈 Roadmap

### Corto Plazo (1 mes)
- [ ] Notificaciones push
- [ ] Recordatorios de turnos
- [ ] Envío de imágenes de productos
- [ ] Dashboard con métricas avanzadas

### Mediano Plazo (3 meses)
- [ ] Integración con MercadoPago
- [ ] App móvil nativa
- [ ] Multi-idioma
- [ ] CRM completo

### Largo Plazo (6 meses)
- [ ] Machine learning para recomendaciones
- [ ] Integración con Instagram/Telegram
- [ ] Panel de analytics avanzado
- [ ] API pública para integraciones

## 🤝 Contribuir

Las contribuciones son bienvenidas! Para contribuir:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 📞 Soporte

- 📚 **Documentación:** Ver archivos `.md` en la raíz
- 🐛 **Bugs:** Crear issue en el repositorio
- 💬 **Preguntas:** Ver [FAQ_INTEGRACION.md](FAQ_INTEGRACION.md)

## 🌟 Agradecimientos

- [Baileys](https://github.com/WhiskeySockets/Baileys) - Cliente WhatsApp
- [Anthropic](https://www.anthropic.com/) - Claude AI
- [Prisma](https://www.prisma.io/) - ORM moderno
- [Next.js](https://nextjs.org/) - Framework React
- [Supabase](https://supabase.com/) - PostgreSQL managed

---

**Hecho con ❤️ para vendedores que quieren automatizar sin perder el toque humano.**

**Versión:** 1.0.0  
**Fecha:** Diciembre 2024

🚀 **¡A vender!**
