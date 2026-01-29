# 🤖 Desplegar Bot de WhatsApp (chat-auto)

El bot de WhatsApp necesita correr en un servidor separado porque usa Baileys (cliente de WhatsApp) que requiere mantener una conexión persistente.

## 📋 Requisitos

- Cuenta de Railway (gratis, $5 crédito/mes)
- O servidor VPS (Ubuntu/Debian)
- Node.js 18+

## 🚀 Opción 1: Railway (GRATIS - Recomendado)

### 1. Crear nuevo proyecto en Railway

1. Ir a [railway.app](https://railway.app)
2. Click en "New Project"
3. Seleccionar "Deploy from GitHub repo"
4. Elegir tu repositorio `sistema-gestion-completo`

### 2. Configurar el servicio

En la configuración del servicio:

**Settings > General:**
- Service Name: `whatsapp-bot`
- Root Directory: `chat-auto`
- Start Command: `npm start`

**Settings > Variables:**

Agregar estas variables de entorno:

```
TENANT_ID=64670744-ed81-4eaa-b0b4-6a6871e7cd10
TENANT_NAME=VM Electronica
BOT_API_PORT=3001
USE_BACKEND=true
BACKEND_URL=https://tu-backend.railway.app/api
BOT_NAME=Lumi
```

**Solo para Plan Pro (con IA):**
```
ANTHROPIC_API_KEY=sk-ant-api03-tu-key-aqui
```

### 3. Deploy

Railway desplegará automáticamente el bot.

### 4. Obtener URL del bot

Railway te dará una URL como: `https://whatsapp-bot-production-abc123.up.railway.app`

### 5. Configurar el backend

En tu proyecto del backend en Railway, agregar variable:

```
WHATSAPP_BOT_URL=https://whatsapp-bot-production-abc123.up.railway.app
```

### 6. Reiniciar el backend

Railway reiniciará automáticamente después de agregar la variable.

### 7. ¡Listo!

Ahora podés ir al CRM y escanear el QR.

---

## 🚀 Opción 2: VPS (Para producción)

### 1. Conectar al VPS

```bash
ssh usuario@tu-servidor.com
```

### 2. Instalar Node.js y PM2

```bash
# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2
```

### 3. Clonar el repositorio

```bash
cd /home/usuario
git clone https://github.com/tu-usuario/sistema-gestion-completo.git
cd sistema-gestion-completo/chat-auto
```

### 4. Instalar dependencias

```bash
npm install
```

### 5. Configurar variables de entorno

```bash
nano .env
```

Agregar:

```env
# Identificación del tenant
TENANT_ID=64670744-ed81-4eaa-b0b4-6a6871e7cd10
TENANT_NAME=VM Electronica

# Puerto del bot
BOT_API_PORT=3001

# API de Anthropic (Claude) - SOLO para Plan Pro
ANTHROPIC_API_KEY=sk-ant-api03-tu-key-aqui

# Conexión con el backend
USE_BACKEND=true
BACKEND_URL=https://tu-backend.railway.app/api

# Nombre del bot
BOT_NAME=Lumi
```

### 6. Iniciar el bot con PM2

```bash
pm2 start src/index.js --name whatsapp-bot
pm2 save
pm2 startup
```

### 7. Ver logs

```bash
pm2 logs whatsapp-bot
```

### 8. Escanear QR

El QR aparecerá en los logs. También podés acceder desde el CRM del sistema web.

## 🌐 Opción 3: Render.com

### 1. Crear nuevo Web Service

- Conectar tu repositorio de GitHub
- Root Directory: `chat-auto`
- Build Command: `npm install`
- Start Command: `npm start`

### 2. Configurar variables de entorno

En el dashboard de Render, agregar:

```
TENANT_ID=64670744-ed81-4eaa-b0b4-6a6871e7cd10
TENANT_NAME=VM Electronica
BOT_API_PORT=3001
ANTHROPIC_API_KEY=sk-ant-api03-tu-key-aqui
USE_BACKEND=true
BACKEND_URL=https://tu-backend.railway.app/api
BOT_NAME=Lumi
```

### 3. Deploy

Render desplegará automáticamente el bot.

### 4. Obtener URL del bot

Render te dará una URL como: `https://whatsapp-bot-abc123.onrender.com`

## ⚙️ Configurar Backend

En Railway (o donde esté tu backend), agregar variable de entorno:

```
WHATSAPP_BOT_URL=https://tu-bot.onrender.com
```

O si usás VPS:

```
WHATSAPP_BOT_URL=http://tu-servidor.com:3001
```

## 🔄 Multi-Tenant (Múltiples Negocios)

Para correr múltiples bots (uno por negocio):

### Opción A: Múltiples puertos en el mismo servidor

```bash
# Bot 1 (Negocio A)
cd /home/usuario/bot-negocio-a
pm2 start src/index.js --name bot-negocio-a -- --port 3001

# Bot 2 (Negocio B)
cd /home/usuario/bot-negocio-b
pm2 start src/index.js --name bot-negocio-b -- --port 3002
```

Cada bot necesita su propio `.env` con su `TENANT_ID` y `BOT_API_PORT`.

### Opción B: Múltiples servicios en Render

Crear un Web Service separado para cada negocio, cada uno con su propio `TENANT_ID`.

## 📊 Monitoreo

### Ver estado de todos los bots

```bash
pm2 list
```

### Ver logs de un bot específico

```bash
pm2 logs whatsapp-bot
```

### Reiniciar un bot

```bash
pm2 restart whatsapp-bot
```

### Detener un bot

```bash
pm2 stop whatsapp-bot
```

## 🐛 Troubleshooting

### El QR no aparece

1. Verificar que el bot esté corriendo: `pm2 logs whatsapp-bot`
2. Verificar que el puerto esté abierto: `netstat -tulpn | grep 3001`
3. Verificar variables de entorno: `pm2 env whatsapp-bot`

### Error ECONNREFUSED

El backend no puede conectarse al bot. Verificar:

1. Que el bot esté corriendo
2. Que `WHATSAPP_BOT_URL` esté configurada correctamente en el backend
3. Que el firewall permita conexiones al puerto 3001

### El bot se desconecta

WhatsApp puede desconectar el bot si:

- No hay actividad por mucho tiempo
- Se escanea el QR en otro dispositivo
- Hay problemas de red

Solución: Reiniciar el bot y escanear el QR nuevamente.

## 💰 Costos Estimados

- **Railway**: GRATIS ($5 crédito/mes incluido)
- **VPS básico**: $5-10/mes (DigitalOcean, Linode, Vultr)
- **Render.com**: $7/mes (plan Starter)
- **Anthropic API** (solo Plan Pro): $10-50/mes según uso

**Recomendación**: Usar Railway para empezar (gratis), luego migrar a VPS si necesitás más recursos.

## 📝 Notas Importantes

1. **Plan Básico**: No necesita `ANTHROPIC_API_KEY`, solo conecta WhatsApp para CRM manual
2. **Plan Pro**: Requiere `ANTHROPIC_API_KEY` para respuestas automáticas con IA
3. **Sesiones**: Las sesiones de WhatsApp se guardan en `auth_sessions/` - hacer backup regularmente
4. **Seguridad**: Nunca compartir el QR ni las sesiones guardadas

## ✅ Verificar que funciona

1. Ir al CRM en el sistema web
2. Click en "Vincular WhatsApp"
3. Debería aparecer el QR
4. Escanear con WhatsApp
5. Enviar un mensaje de prueba desde otro teléfono
6. Debería aparecer en el CRM

---

**¿Necesitás ayuda?** Contactá al equipo de soporte.
