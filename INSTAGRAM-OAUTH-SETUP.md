# 📱 Configuración de Instagram OAuth

⚠️ **IMPORTANTE**: Esta configuración la hacés **VOS UNA SOLA VEZ** como administrador del sistema. Tus clientes solo harán clic en "Conectar con Instagram" y listo, como en ManyChat.

---

## 🎯 ¿Cómo funciona?

### Para el cliente (usuario final):
1. Va a **Ajustes → Integraciones**
2. Hace clic en **"Conectar con Instagram"**
3. Autoriza con su Facebook
4. Selecciona su página de Facebook
5. ¡Listo! Ya está conectado

### Para vos (administrador del sistema):
1. Creás **UNA app de Facebook** (una sola vez)
2. Configurás las variables de entorno en Railway y Vercel
3. **Todos tus clientes usan esa misma app**
4. Los clientes NO necesitan crear nada en Facebook Developers

---

## � Conofiguración Inicial (Solo vos, una vez)

### Paso 1: Crear App en Facebook Developers (5 minutos)

1. Ve a [Facebook Developers](https://developers.facebook.com/apps)
2. Haz clic en **"Crear app"**
3. Selecciona **"Empresa"** como tipo de app
4. Completa:
   - **Nombre de la app**: "Sistema CRM MundoApple" (o el nombre que quieras)
   - **Email de contacto**: tu email
5. Haz clic en **"Crear app"**
6. **Guarda el App ID y App Secret** (los necesitarás después)

---

### Paso 2: Agregar Productos (2 minutos)

1. En el panel de tu app, busca **"Instagram"** en productos
2. Haz clic en **"Configurar"**
3. También agrega **"Messenger"** (necesario para Instagram)
4. Haz clic en **"Configurar"**

---

### Paso 3: Configurar Dominios y OAuth (5 minutos)

#### 3.1 Configurar Dominios (IMPORTANTE)

1. Ve a **"Configuración" → "Básica"** en el menú lateral
2. Copia el **ID de la app** y la **Clave secreta de la app** (los necesitarás después)
3. Baja hasta encontrar **"Dominios de la app"**
4. Agrega estos dominios (uno por línea):
   ```
   localhost
   app.mundoiahelp.store
   ```
5. Guarda los cambios

#### 3.2 Configurar OAuth (Solo si tu app está en modo producción)

⚠️ **NOTA**: Si tu app está en **modo desarrollo**, NO necesitas configurar URIs de redirección. Solo agrega tu cuenta como administrador en **"Roles de la app" → "Roles"**.

Si tu app está en **modo producción** o ya obtuviste acceso avanzado:

1. Ve a **"Productos" → "Inicio de sesión con Facebook" → "Configuración"**
2. En **"URI de redireccionamiento de OAuth válidos"**, agrega:
   ```
   https://app.mundoiahelp.store/api/instagram/callback
   http://localhost:3000/api/instagram/callback
   ```
3. Guarda los cambios

---

### Paso 4: Configurar Webhooks (5 minutos)

#### 4.1 Webhook de Instagram

1. Ve a **"Productos" → "Instagram" → "Configuración"**
2. En **"Webhooks"**, haz clic en **"Configurar webhooks"**
3. Completa:
   - **URL de devolución de llamada**: 
     ```
     https://distcba.gestion-completo.production-88bc.up.railway.app/api/instagram/webhook
     ```
   - **Token de verificación**: `mi_token_secreto_123`
4. Haz clic en **"Verificar y guardar"**
5. Suscríbete a los campos:
   - ✅ `messages`
   - ✅ `messaging_postbacks`

#### 4.2 Webhook de Messenger

1. Ve a **"Productos" → "Messenger" → "Configuración"**
2. En **"Webhooks"**, haz clic en **"Agregar URL de devolución de llamada"**
3. Usa la misma URL y token que arriba
4. Suscríbete a los mismos campos

---

### Paso 5: Configurar Variables de Entorno (3 minutos)

#### En Railway (Backend):

1. Ve a tu proyecto en Railway
2. Selecciona el servicio **"server"**
3. Ve a **"Variables"**
4. Agrega estas variables:

```env
FACEBOOK_APP_ID=tu_app_id_aqui
FACEBOOK_APP_SECRET=tu_app_secret_aqui
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=mi_token_secreto_123
```

5. Guarda y espera que se redeploy automáticamente

#### En Vercel (Frontend):

1. Ve a tu proyecto en Vercel
2. Ve a **"Settings" → "Environment Variables"**
3. Agrega esta variable:

```env
NEXT_PUBLIC_FACEBOOK_APP_ID=tu_app_id_aqui
```

4. Guarda y redeploy el proyecto

---

### Paso 6: Permisos de la App (Importante)

#### Modo de Desarrollo (para probar):

1. Ve a **"Roles" → "Roles"** en tu app
2. Agrega tu cuenta de Facebook como **"Administrador"**
3. Agrega las cuentas de prueba que necesites
4. En modo desarrollo, solo estas cuentas podrán conectarse
5. **No requiere revisión de Meta**

#### Modo Producción (para clientes reales):

1. Ve a **"Revisión de la app" → "Permisos y funciones"**
2. Solicita los siguientes permisos:
   - ✅ `pages_show_list`
   - ✅ `pages_messaging`
   - ✅ `instagram_basic`
   - ✅ `instagram_manage_messages`
   - ✅ `pages_manage_metadata`
3. Completa el formulario de revisión de Meta
4. Espera aprobación (1-2 semanas)
5. Una vez aprobado, cambia la app a **"Modo en vivo"**

**Nota**: Mientras estés en modo desarrollo, solo vos y las cuentas que agregues como administradores/desarrolladores podrán conectarse. Para que cualquier cliente pueda conectarse, necesitás pasar a modo producción.

---

## 🚀 Probar la Integración

### Como Administrador (Modo Desarrollo):

1. Asegúrate de que tu cuenta de Facebook sea **administrador** de la app
2. Ve a **Ajustes → Integraciones** en el sistema
3. Haz clic en **"Conectar con Instagram"**
4. Autoriza los permisos
5. Selecciona tu página de Facebook
6. ¡Listo! Deberías ver "Instagram Conectado"

### Probar Mensajes:

1. Envía un mensaje directo a tu cuenta de Instagram Business desde otra cuenta
2. El mensaje debería aparecer en el CRM
3. Responde desde el CRM
4. La respuesta debería llegar a Instagram

---

## 🐛 Troubleshooting

### Error: "Facebook App ID no configurado"

**Solución**: Verifica que hayas agregado `NEXT_PUBLIC_FACEBOOK_APP_ID` en Vercel y que el proyecto se haya redeployado.

### Error: "No se encontró una cuenta de Instagram Business"

**Solución**: Asegúrate de que:
1. Tu Instagram es una cuenta **Business** (no Personal)
2. Está vinculada a una **Página de Facebook**
3. Eres administrador de esa página

### Error: "Invalid OAuth redirect URI"

**Solución**: Verifica que las URIs de redirección en Facebook Developers sean exactamente:
```
https://app.mundoiahelp.store/api/instagram/callback
http://localhost:3000/api/instagram/callback
```

**Pasos para verificar:**
1. Ve a [Facebook Developers](https://developers.facebook.com/apps)
2. Selecciona tu app
3. Ve a **"Productos" → "Inicio de sesión con Facebook" → "Configuración"**
4. Busca **"URI de redireccionamiento de OAuth válidos"**
5. Asegúrate de que las URLs estén agregadas EXACTAMENTE como arriba
6. Guarda los cambios y espera 1-2 minutos

**Nota**: La URL debe coincidir exactamente con `window.location.origin + '/api/instagram/callback'` de tu frontend.

### Los mensajes no llegan al CRM

**Solución**:
1. Verifica que el webhook esté configurado correctamente
2. Revisa los logs de Railway para ver si llegan las peticiones
3. Asegúrate de que el token de verificación coincida

### Error: "This message is sent outside of allowed window"

**Solución**: Instagram solo permite responder dentro de las 24 horas del último mensaje del cliente, a menos que tengas permisos especiales aprobados por Meta.

---

## ✅ Checklist Final

Antes de poner en producción, verifica:

- [ ] App de Facebook creada
- [ ] Instagram y Messenger agregados como productos
- [ ] OAuth configurado con URI correcta
- [ ] Webhooks configurados y verificados
- [ ] Variables de entorno configuradas en Railway
- [ ] Variables de entorno configuradas en Vercel
- [ ] Ambos proyectos redeployados
- [ ] Tu cuenta agregada como administrador de la app
- [ ] Probado con tu cuenta de Instagram
- [ ] Mensajes llegan al CRM
- [ ] Puedes responder desde el CRM

---

## 📚 Recursos Adicionales

- [Documentación de Instagram Graph API](https://developers.facebook.com/docs/instagram-api)
- [Guía de Webhooks de Instagram](https://developers.facebook.com/docs/messenger-platform/webhooks)
- [Permisos de Instagram](https://developers.facebook.com/docs/instagram-api/overview#permissions)

---

## 💡 Resumen para el Cliente

Cuando un cliente te pregunte cómo conectar Instagram, solo decile:

1. Andá a **Ajustes → Integraciones**
2. Hacé clic en **"Conectar con Instagram"**
3. Autorizá con tu Facebook
4. Seleccioná tu página de Facebook
5. ¡Listo!

**No necesitan crear nada en Facebook Developers ni configurar nada técnico.**

---

**¿Necesitas ayuda?** Revisa los logs de Railway y la consola del navegador (F12) para más detalles sobre errores.
