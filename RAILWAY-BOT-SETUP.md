# 🚂 Configurar Bot de WhatsApp en Railway (GRATIS)

Guía paso a paso para desplegar el bot de WhatsApp en Railway.

## 📋 Antes de empezar

Necesitás:
- Cuenta de Railway (gratis en [railway.app](https://railway.app))
- Tu repositorio de GitHub conectado
- El TENANT_ID de tu negocio

## 🎯 Paso 1: Crear nuevo proyecto

1. Ir a [railway.app](https://railway.app)
2. Click en **"New Project"**
3. Seleccionar **"Deploy from GitHub repo"**
4. Elegir tu repositorio: `sistema-gestion-completo`

## ⚙️ Paso 2: Configurar el servicio

### 2.1 Settings > General

- **Service Name**: `whatsapp-bot`
- **Root Directory**: `chat-auto`
- **Start Command**: `npm start`

### 2.2 Settings > Variables

Click en **"New Variable"** y agregar una por una:

#### Variables obligatorias (para todos):

```
TENANT_ID
Valor: 64670744-ed81-4eaa-b0b4-6a6871e7cd10
```

```
TENANT_NAME
Valor: VM Electronica
```

```
BOT_API_PORT
Valor: 3001
```

```
USE_BACKEND
Valor: true
```

```
BACKEND_URL
Valor: https://sistema-gestion-completo-production-08bc.up.railway.app/api
```

```
BOT_NAME
Valor: Lumi
```

#### Variable opcional (solo Plan Pro con IA):

```
ANTHROPIC_API_KEY
Valor: sk-ant-api03-tu-key-de-anthropic-aqui
```

**Nota**: Si NO agregás `ANTHROPIC_API_KEY`, el bot solo conectará WhatsApp para CRM manual (Plan Básico). Si la agregás, el bot responderá automáticamente con IA (Plan Pro).

### 2.3 Settings > Networking

Railway generará automáticamente una URL pública como:

```
https://whatsapp-bot-production-abc123.up.railway.app
```

**¡Copiá esta URL!** La vas a necesitar en el siguiente paso.

## 🔗 Paso 3: Conectar el backend con el bot

1. Ir a tu proyecto del **backend** en Railway
2. Click en el servicio del backend
3. Ir a **Settings > Variables**
4. Agregar nueva variable:

```
WHATSAPP_BOT_URL
Valor: https://whatsapp-bot-production-abc123.up.railway.app
```

(Reemplazar con la URL que copiaste en el paso anterior)

5. Railway reiniciará automáticamente el backend

## ✅ Paso 4: Verificar que funciona

### 4.1 Ver logs del bot

1. En Railway, ir al servicio `whatsapp-bot`
2. Click en **"Deployments"**
3. Click en el deployment activo
4. Ver los logs - deberías ver:

```
🤖 Iniciando Lumi Bot...
🏢 Bot iniciando para: VM Electronica (64670744-...)
📱 Conectando con WhatsApp...
✅ Lumi Bot iniciado correctamente!
🌐 API del bot escuchando en puerto 3001
```

### 4.2 Probar desde el sistema web

1. Ir a tu sistema web
2. Iniciar sesión
3. Ir a **CRM**
4. Click en **"Vincular WhatsApp"**
5. Debería aparecer el código QR
6. Escanear con WhatsApp
7. ¡Listo! Ya podés ver y responder mensajes desde el CRM

## 🐛 Troubleshooting

### Error: "No se pudo generar el código QR"

**Causa**: El bot no está corriendo o la URL no está configurada.

**Solución**:
1. Verificar que el bot esté desplegado en Railway (ver logs)
2. Verificar que `WHATSAPP_BOT_URL` esté configurada en el backend
3. Reiniciar ambos servicios

### Error: "Bot de WhatsApp no configurado"

**Causa**: Falta la variable `WHATSAPP_BOT_URL` en el backend.

**Solución**:
1. Ir al backend en Railway
2. Settings > Variables
3. Agregar `WHATSAPP_BOT_URL` con la URL del bot
4. Esperar que reinicie

### El bot se desconecta

**Causa**: WhatsApp desconecta la sesión después de un tiempo sin actividad.

**Solución**:
1. Ir al CRM
2. Click en "Vincular WhatsApp"
3. Escanear el QR nuevamente

### Error: "ECONNREFUSED"

**Causa**: El backend no puede conectarse al bot.

**Solución**:
1. Verificar que ambos servicios estén corriendo
2. Verificar que la URL del bot sea correcta
3. Verificar que no haya typos en `WHATSAPP_BOT_URL`

## 💡 Tips

### Múltiples negocios (Multi-tenant)

Para correr bots para múltiples negocios:

1. Crear un servicio separado en Railway para cada negocio
2. Cada uno con su propio `TENANT_ID`
3. Cada uno con su propia URL
4. Configurar `WHATSAPP_BOT_URL` en el backend con la URL del bot principal

### Monitorear el bot

Railway te permite ver:
- **Logs en tiempo real**: Para ver qué está pasando
- **Métricas**: CPU, memoria, requests
- **Deployments**: Historial de despliegues

### Backup de sesiones

Las sesiones de WhatsApp se guardan en `auth_sessions/`. Railway las mantiene mientras el servicio esté corriendo, pero si eliminás el servicio, se pierden.

**Recomendación**: Hacer backup periódico descargando la carpeta `auth_sessions/`.

## 💰 Costos

Railway te da **$5 de crédito gratis por mes**, que es suficiente para:

- 1 bot de WhatsApp corriendo 24/7
- Tráfico moderado de mensajes
- Sin necesidad de tarjeta de crédito

Si necesitás más recursos, podés:
- Agregar tarjeta para crédito adicional
- Migrar a un VPS ($5-10/mes)

## 📊 Diferencia entre planes

### Plan Básico (Sin `ANTHROPIC_API_KEY`)
- ✅ Conecta WhatsApp al CRM
- ✅ Ver todos los mensajes
- ✅ Responder manualmente desde el CRM
- ❌ NO responde automáticamente con IA

### Plan Pro (Con `ANTHROPIC_API_KEY`)
- ✅ Todo lo del Plan Básico
- ✅ Responde automáticamente con IA
- ✅ Agenda turnos automáticamente
- ✅ Consulta stock automáticamente
- ✅ Personalidad argentina y tono humano

## 🎉 ¡Listo!

Ahora tenés tu bot de WhatsApp corriendo gratis en Railway, conectado a tu sistema de gestión.

**Próximos pasos**:
1. Probar enviando mensajes desde otro teléfono
2. Ver que aparezcan en el CRM
3. Responder desde el CRM
4. (Plan Pro) Dejar que el bot responda automáticamente

---

**¿Problemas?** Revisá los logs en Railway o contactá al soporte.
