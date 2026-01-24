# 🤖 Guía de Deploy - Bot de WhatsApp (chat-auto)

## ⚠️ IMPORTANTE

El bot de WhatsApp **NO se puede deployar en Railway/Vercel** porque:
- Necesita mantener la sesión de WhatsApp activa 24/7
- Requiere escanear QR code al inicio
- Los servicios serverless se apagan cuando no hay requests
- La sesión de WhatsApp se pierde si el proceso se reinicia

**Necesitas un VPS (servidor dedicado) que esté siempre prendido.**

---

## 🎯 OPCIONES DE DEPLOYMENT

### Opción 1: VPS Económico (Recomendado)
**Costo:** $5-10/mes

Proveedores recomendados:
- **DigitalOcean** - Droplet básico ($6/mes)
- **Vultr** - Cloud Compute ($5/mes)
- **Linode** - Nanode ($5/mes)
- **Contabo** - VPS S ($4/mes)

### Opción 2: Servidor Local (Gratis)
**Costo:** $0 (solo electricidad)

- Usar una PC/laptop vieja que tengas
- Dejarla prendida 24/7
- Configurar IP dinámica con DuckDNS o No-IP

### Opción 3: Railway con Persistencia (Experimental)
**Costo:** $5-10/mes
**Limitación:** Puede perder la sesión al reiniciar

---

## 📋 OPCIÓN 1: VPS (RECOMENDADO)

### Paso 1: Crear VPS

1. Ir a https://www.digitalocean.com (o tu proveedor preferido)
2. Crear cuenta
3. Crear Droplet:
   - **OS**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/mes)
   - **CPU**: 1 vCPU
   - **RAM**: 1GB
   - **Storage**: 25GB SSD
   - **Region**: El más cercano a ti

### Paso 2: Conectar al VPS

```bash
ssh root@tu-ip-del-vps
```

### Paso 3: Instalar Node.js

```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verificar instalación
node --version  # Debe mostrar v18.x.x
npm --version
```

### Paso 4: Instalar PM2 (Process Manager)

```bash
npm install -g pm2
```

### Paso 5: Clonar Repositorio

```bash
# Instalar git si no está
apt install -y git

# Clonar tu repo
cd /root
git clone https://github.com/tu-usuario/sistema-gestion-completo.git
cd sistema-gestion-completo/chat-auto
```

### Paso 6: Configurar Variables de Entorno

```bash
nano .env
```

Pegar esto (ajustar valores):

```env
# ============================================
# BOT DE WHATSAPP - PRODUCCIÓN
# ============================================

# Anthropic API (para IA del bot)
ANTHROPIC_API_KEY=tu-api-key-de-anthropic

# Backend API (Railway)
BACKEND_URL=https://tu-backend.up.railway.app/api
BACKEND_TOKEN=tu-jwt-token-aqui
USE_BACKEND=true

# Configuración del Bot
BOT_NAME=Lumi
BOT_API_PORT=3001

# Tenant (cliente)
TENANT_ID=sistema
TENANT_NAME=Mundo Apple

# Configuración de negocio
BUSINESS_NAME=Mundo Apple
BUSINESS_PHONE=+5491112345678
BUSINESS_ADDRESS=Dirección de tu local
BUSINESS_HOURS=Lun-Vie 9-18hs, Sab 10-14hs

# Warranty y políticas
WARRANTY_DAYS=30
SHIPS_ORDERS=false
PAYMENT_METHODS=efectivo,transferencia,usdt
SHIPPING_ZONES=CABA,GBA
SHIPPING_TIME=24-48hs
RETURN_POLICY=30 días con factura
RESERVATION_DEPOSIT=20%

# Google Sheets (opcional, si no usas backend)
USE_SHEETS=false
```

Guardar: `Ctrl+X`, `Y`, `Enter`

### Paso 7: Instalar Dependencias

```bash
npm install
```

### Paso 8: Iniciar Bot con PM2

```bash
pm2 start src/index.js --name "bot-whatsapp"
pm2 save
pm2 startup
```

### Paso 9: Escanear QR de WhatsApp

```bash
# Ver logs del bot
pm2 logs bot-whatsapp
```

Verás un QR code en ASCII. Escanealo con WhatsApp:
1. Abrir WhatsApp en tu teléfono
2. Ir a **Configuración** → **Dispositivos vinculados**
3. **Vincular un dispositivo**
4. Escanear el QR que aparece en los logs

### Paso 10: Verificar que Funciona

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs bot-whatsapp --lines 50
```

Envía un mensaje de WhatsApp al número vinculado y verifica que el bot responde.

---

## 🔄 COMANDOS ÚTILES PM2

```bash
# Ver estado de todos los procesos
pm2 status

# Ver logs
pm2 logs bot-whatsapp

# Reiniciar bot
pm2 restart bot-whatsapp

# Detener bot
pm2 stop bot-whatsapp

# Eliminar bot
pm2 delete bot-whatsapp

# Ver uso de recursos
pm2 monit
```

---

## 🔐 SEGURIDAD DEL VPS

### 1. Crear Usuario No-Root

```bash
adduser botuser
usermod -aG sudo botuser
su - botuser
```

### 2. Configurar Firewall

```bash
# Permitir SSH
ufw allow 22

# Permitir puerto del bot (si necesitas acceso externo)
ufw allow 3001

# Activar firewall
ufw enable
```

### 3. Configurar SSH con Clave

```bash
# En tu PC local, generar clave SSH
ssh-keygen -t rsa -b 4096

# Copiar clave al VPS
ssh-copy-id root@tu-ip-del-vps
```

---

## 📊 OPCIÓN 2: SERVIDOR LOCAL

### Requisitos
- PC/Laptop con Windows/Linux/Mac
- Conexión a internet estable
- Dejarla prendida 24/7

### Paso 1: Instalar Node.js

Descargar de https://nodejs.org (versión 18 LTS)

### Paso 2: Clonar Repositorio

```bash
git clone https://github.com/tu-usuario/sistema-gestion-completo.git
cd sistema-gestion-completo/chat-auto
```

### Paso 3: Configurar .env

Crear archivo `.env` con la configuración (igual que VPS)

### Paso 4: Instalar PM2

```bash
npm install -g pm2
```

### Paso 5: Iniciar Bot

```bash
npm install
pm2 start src/index.js --name "bot-whatsapp"
pm2 save
pm2 startup
```

### Paso 6: Configurar IP Dinámica (Opcional)

Si quieres que el backend se conecte al bot:

1. Crear cuenta en https://www.duckdns.org
2. Crear dominio (ej: `mibot.duckdns.org`)
3. Configurar router para port forwarding (puerto 3001)
4. Actualizar IP en DuckDNS cada vez que cambie

---

## 🚀 OPCIÓN 3: RAILWAY (EXPERIMENTAL)

**⚠️ Advertencia:** Railway puede reiniciar el servicio y perderás la sesión de WhatsApp.

### Paso 1: Crear Servicio en Railway

1. Ir a https://railway.app/new
2. Deploy from GitHub → tu repo
3. Seleccionar carpeta `chat-auto`

### Paso 2: Configurar Variables

En Railway → Variables:

```env
ANTHROPIC_API_KEY=tu-api-key
BACKEND_URL=https://tu-backend.up.railway.app/api
BACKEND_TOKEN=tu-jwt-token
USE_BACKEND=true
BOT_NAME=Lumi
BOT_API_PORT=3001
TENANT_ID=sistema
TENANT_NAME=Mundo Apple
```

### Paso 3: Configurar Build

En Settings → Build:
- **Root Directory**: `chat-auto`
- **Build Command**: `npm install`
- **Start Command**: `node src/index.js`

### Paso 4: Escanear QR

1. Ir a **Deployments** → último deployment
2. **View Logs**
3. Buscar el QR code en los logs
4. Escanearlo rápido antes que expire

**Problema:** Si Railway reinicia el servicio, tendrás que escanear el QR nuevamente.

---

## 🔗 INTEGRACIÓN CON EL SISTEMA

### Backend → Bot

El backend puede enviar mensajes al bot:

```javascript
// En el backend (server)
const response = await fetch('http://tu-vps-ip:3001/api/send-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '5491112345678',
    message: 'Hola! Tu turno fue confirmado.'
  })
});
```

### Bot → Backend

El bot ya está configurado para usar el backend:

```env
USE_BACKEND=true
BACKEND_URL=https://tu-backend.up.railway.app/api
BACKEND_TOKEN=tu-jwt-token
```

---

## 📝 OBTENER JWT TOKEN

Para que el bot se conecte al backend, necesitas un token JWT:

### Opción 1: Desde el Sistema Web

1. Login en https://app.mundoaple.store
2. Abrir DevTools (F12)
3. Ir a **Application** → **Local Storage**
4. Copiar el valor de `token`

### Opción 2: Generar Manualmente

```bash
# En la carpeta server
node -e "
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: 'bot-user', role: 'BOT' },
  process.env.JWT_SECRET,
  { expiresIn: '365d' }
);
console.log(token);
"
```

---

## 🆘 TROUBLESHOOTING

### El bot no responde

```bash
# Ver logs
pm2 logs bot-whatsapp

# Reiniciar
pm2 restart bot-whatsapp
```

### Error de conexión con backend

Verificar:
1. `BACKEND_URL` es correcta
2. `BACKEND_TOKEN` es válido
3. Backend está online

### QR code no aparece

```bash
# Eliminar sesión vieja
rm -rf auth_sessions/*

# Reiniciar bot
pm2 restart bot-whatsapp
```

### Bot se desconecta de WhatsApp

WhatsApp puede desconectar si:
- No hay actividad por mucho tiempo
- Se vincula en otro dispositivo
- Cambió la IP del servidor

**Solución:** Volver a escanear QR

---

## 💰 COSTOS ESTIMADOS

### VPS (Recomendado)
- **DigitalOcean**: $6/mes
- **Anthropic API**: $10-30/mes (según uso)
- **Total**: $16-36/mes

### Servidor Local
- **Electricidad**: ~$5/mes
- **Anthropic API**: $10-30/mes
- **Total**: $15-35/mes

### Railway (No recomendado)
- **Railway**: $5-10/mes
- **Anthropic API**: $10-30/mes
- **Problema**: Sesión inestable
- **Total**: $15-40/mes

---

## ✅ CHECKLIST FINAL

- [ ] VPS creado y configurado
- [ ] Node.js 18 instalado
- [ ] PM2 instalado
- [ ] Repositorio clonado
- [ ] Variables de entorno configuradas
- [ ] Dependencias instaladas
- [ ] Bot iniciado con PM2
- [ ] QR escaneado
- [ ] Bot responde mensajes
- [ ] Integración con backend funciona
- [ ] Firewall configurado

---

## 🎉 ¡LISTO!

Tu bot está corriendo 24/7 y responde automáticamente a todos los mensajes de WhatsApp.

**Próximos pasos:**
1. Probar enviando mensajes al bot
2. Verificar que los turnos se guardan en el sistema
3. Configurar notificaciones automáticas
4. Personalizar respuestas del bot

**¿Problemas?** Revisar logs con `pm2 logs bot-whatsapp`
