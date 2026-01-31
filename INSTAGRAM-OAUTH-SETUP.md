# 📱 Configuración de Instagram OAuth

Esta guía te ayudará a configurar la integración de Instagram con OAuth, igual que ManyChat.

## 🎯 Requisitos Previos

1. **Cuenta de Instagram Business** vinculada a una **Página de Facebook**
2. **Cuenta de Facebook Developers** (gratis)

---

## 📝 Paso 1: Crear App en Facebook Developers

1. Ve a [Facebook Developers](https://developers.facebook.com/apps)
2. Haz clic en **"Crear app"**
3. Selecciona **"Empresa"** como tipo de app
4. Completa:
   - **Nombre de la app**: "Sistema CRM" (o el nombre que quieras)
   - **Email de contacto**: tu email
5. Haz clic en **"Crear app"**

---

## 🔧 Paso 2: Configurar Productos

### 2.1 Agregar Instagram

1. En el panel de tu app, busca **"Instagram"** en productos
2. Haz clic en **"Configurar"**
3. Completa la configuración básica

### 2.2 Agregar Messenger (necesario para Instagram)

1. Busca **"Messenger"** en productos
2. Haz clic en **"Configurar"**

---

## 🔐 Paso 3: Configurar OAuth

### 3.1 Configuración de OAuth

1. Ve a **"Configuración" → "Básica"** en el menú lateral
2. Copia el **ID de la app** y el **Clave secreta de la app**
3. Guárdalos, los necesitarás después

### 3.2 URIs de Redirección OAuth Válidos

1. Ve a **"Productos" → "Inicio de sesión con Facebook" → "Configuración"**
2. En **"URI de redireccionamiento de OAuth válidos"**, agrega:
   ```
   https://app.mundoiahelp.store/api/instagram/callback
   http://localhost:3000/api/instagram/callback
   ```
3. Guarda los cambios

---

## 🔔 Paso 4: Configurar Webhooks

### 4.1 Configurar Webhook de Instagram

1. Ve a **"Productos" → "Instagram" → "Configuración"**
2. En **"Webhooks"**, haz clic en **"Configurar webhooks"**
3. Completa:
   - **URL de devolución de llamada**: `https://distcba.gestion-completo.production-88bc.up.railway.app/api/instagram/webhook`
   - **Token de verificación**: `mi_token_secreto_123`
4. Haz clic en **"Verificar y guardar"**
5. Suscríbete a los campos:
   - ✅ `messages`
   - ✅ `messaging_postbacks`

### 4.2 Configurar Webhook de Messenger (para Instagram)

1. Ve a **"Productos" → "Messenger" → "Configuración"**
2. En **"Webhooks"**, haz clic en **"Agregar URL de devolución de llamada"**
3. Usa la misma URL y token que arriba
4. Suscríbete a los mismos campos

---

## 🔑 Paso 5: Permisos de la App

### 5.1 Solicitar Permisos

1. Ve a **"Revisión de la app" → "Permisos y funciones"**
2. Solicita los siguientes permisos:
   - ✅ `pages_show_list` (Básico - aprobado automáticamente)
   - ✅ `pages_messaging` (Requiere revisión)
   - ✅ `instagram_basic` (Básico - aprobado automáticamente)
   - ✅ `instagram_manage_messages` (Requiere revisión)
   - ✅ `pages_manage_metadata` (Básico - aprobado automáticamente)

### 5.2 Modo de Desarrollo vs Producción

**Modo de Desarrollo** (para probar):
- Funciona solo con cuentas que sean administradores/desarrolladores de la app
- No requiere revisión de Meta
- Perfecto para testing

**Modo Producción** (para clientes):
- Requiere revisión de Meta (puede tardar 1-2 semanas)
- Funciona con cualquier cuenta de Instagram
- Necesario para uso real

---

## ⚙️ Paso 6: Configurar Variables de Entorno

### 6.1 Backend (Railway)

Agrega estas variables en Railway:

```env
FACEBOOK_APP_ID=tu_app_id_aqui
FACEBOOK_APP_SECRET=tu_app_secret_aqui
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=mi_token_secreto_123
```

### 6.2 Frontend (Vercel)

Agrega esta variable en Vercel:

```env
NEXT_PUBLIC_FACEBOOK_APP_ID=tu_app_id_aqui
```

---

## 🚀 Paso 7: Probar la Integración

### 7.1 En Desarrollo

1. Asegúrate de que tu cuenta de Facebook sea **administrador** de la app
2. Ve a **Ajustes → Integraciones** en el sistema
3. Haz clic en **"Conectar con Instagram"**
4. Autoriza los permisos
5. Selecciona tu página de Facebook
6. ¡Listo! Deberías ver "Instagram Conectado"

### 7.2 Probar Mensajes

1. Envía un mensaje directo a tu cuenta de Instagram Business desde otra cuenta
2. El mensaje debería aparecer en el CRM
3. Responde desde el CRM
4. La respuesta debería llegar a Instagram

---

## 🐛 Troubleshooting

### Error: "No se encontró una cuenta de Instagram Business"

**Solución**: Asegúrate de que:
1. Tu Instagram es una cuenta **Business** (no Personal)
2. Está vinculada a una **Página de Facebook**
3. Eres administrador de esa página

### Error: "Invalid OAuth redirect URI"

**Solución**: Verifica que la URI de redirección en Facebook Developers coincida exactamente con la configurada en el sistema.

### Los mensajes no llegan al CRM

**Solución**:
1. Verifica que el webhook esté configurado correctamente
2. Revisa los logs de Railway para ver si llegan las peticiones
3. Asegúrate de que el token de verificación coincida

### Error: "This message is sent outside of allowed window"

**Solución**: Este error aparece si intentas responder después de 24 horas. Instagram solo permite responder dentro de las 24 horas del último mensaje del cliente, a menos que tengas permisos especiales aprobados por Meta.

---

## 📚 Recursos Adicionales

- [Documentación de Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Guía de Webhooks de Instagram](https://developers.facebook.com/docs/messenger-platform/webhooks)
- [Permisos de Instagram](https://developers.facebook.com/docs/instagram-api/overview#permissions)

---

## ✅ Checklist Final

Antes de poner en producción, verifica:

- [ ] App de Facebook creada
- [ ] Instagram y Messenger agregados como productos
- [ ] OAuth configurado con URIs correctas
- [ ] Webhooks configurados y verificados
- [ ] Variables de entorno configuradas en Railway y Vercel
- [ ] Permisos solicitados (al menos en modo desarrollo)
- [ ] Probado con tu cuenta de Instagram
- [ ] Mensajes llegan al CRM
- [ ] Puedes responder desde el CRM

---

**¿Necesitas ayuda?** Revisa los logs de Railway y la consola del navegador (F12) para más detalles sobre errores.
