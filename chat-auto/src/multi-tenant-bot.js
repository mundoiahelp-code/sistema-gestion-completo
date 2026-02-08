import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState 
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode';
import axios from 'axios';
import express from 'express';
import fs from 'fs';
import path from 'path';

const BACKEND_URL = (process.env.BACKEND_URL || 'https://distcba.gestion-completo.production-88bc.up.railway.app').replace(/\/api\/?$/, '');
const BOT_PORT = process.env.BOT_API_PORT || 3001;

console.log('🤖 Bot Multi-Tenant - Iniciando...');
console.log(`🌐 Backend: ${BACKEND_URL}`);

// Mapa de conexiones: { tenantId: { sock, qr, phone } }
const connections = new Map();

// Normalizar número de teléfono
function normalizePhone(phone) {
  return phone.replace(/@s\.whatsapp\.net|@lid|@g\.us|@c\.us/g, '').replace(/\D/g, '');
}

// Función para guardar mensaje en el backend
async function saveMessage(tenantId, phone, message, response = '', contactName = null, originalJid = null) {
  try {
    const cleanPhone = normalizePhone(phone);
    
    const result = await axios.post(
      `${BACKEND_URL}/api/bot/messages`,
      {
        customerPhone: cleanPhone,
        customerName: contactName,
        originalJid: originalJid || phone, // Guardar el JID original para responder
        message: message,
        response: response,
        intent: 'RECIBIDO',
        status: response ? 'responded' : 'pending',
        platform: 'whatsapp'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        }
      }
    );
    
    console.log(`✅ [${tenantId}] Guardado: ${cleanPhone} (${contactName || 'Sin nombre'}) - "${message.substring(0, 30)}..."`);
    return true;
  } catch (error) {
    console.error(`❌ [${tenantId}] Error guardando:`, error.response?.data || error.message);
    return false;
  }
}

// Verificar si el bot debe responder automáticamente
async function shouldBotRespond(tenantId) {
  try {
    console.log(`🔍 [${tenantId}] Verificando estado del bot...`);
    console.log(`🔍 [${tenantId}] Backend URL: ${BACKEND_URL}`);
    
    // Obtener configuración del tenant (endpoint público para bots)
    const tenantUrl = `${BACKEND_URL}/api/tenants/public/current`;
    console.log(`🔍 [${tenantId}] GET ${tenantUrl}`);
    
    const tenantResponse = await axios.get(tenantUrl, {
      headers: { 'X-Tenant-ID': tenantId }
    });
    
    const tenant = tenantResponse.data.tenant;
    if (!tenant) {
      console.log(`⚠️  [${tenantId}] No se pudo obtener config del tenant`);
      return false;
    }
    
    console.log(`📋 [${tenantId}] Plan del tenant: ${tenant.plan}`);
    
    // Solo plan PRO tiene bot IA
    const planLower = (tenant.plan || '').toLowerCase();
    if (planLower !== 'pro') {
      console.log(`⚠️  [${tenantId}] Plan ${tenant.plan} no tiene bot IA (solo PRO)`);
      return false;
    }
    
    // Verificar si el bot está activo
    const configUrl = `${BACKEND_URL}/api/bot/public/config`;
    console.log(`🔍 [${tenantId}] GET ${configUrl}`);
    
    const configResponse = await axios.get(configUrl, {
      headers: { 'X-Tenant-ID': tenantId }
    });
    
    const config = configResponse.data.config;
    const isActive = config?.isActive !== false;
    
    console.log(`🤖 [${tenantId}] Bot ${isActive ? 'ACTIVO ✅' : 'INACTIVO ❌'}`);
    return isActive;
  } catch (error) {
    console.error(`❌ [${tenantId}] Error verificando bot:`, error.message);
    if (error.response) {
      console.error(`❌ [${tenantId}] Status: ${error.response.status}`);
      console.error(`❌ [${tenantId}] Data:`, error.response.data);
    }
    return false;
  }
}

// Generar respuesta del bot usando IA
async function generateBotResponse(tenantId, message) {
  try {
    console.log(`🤖 [${tenantId}] Generando respuesta con IA...`);
    
    const response = await axios.post(
      `${BACKEND_URL}/api/bot/generate-response`,
      { message },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId
        },
        timeout: 30000 // 30 segundos
      }
    );
    
    console.log(`✅ [${tenantId}] Respuesta generada`);
    return response.data.response || null;
  } catch (error) {
    console.error(`❌ [${tenantId}] Error generando respuesta:`, error.message);
    return null;
  }
}

// Función para enviar mensaje
async function sendMessage(tenantId, phone, message) {
  const conn = connections.get(tenantId);
  if (!conn || !conn.sock) {
    console.error(`❌ [${tenantId}] WhatsApp no conectado`);
    return false;
  }
  
  try {
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    await conn.sock.sendMessage(jid, { text: message });
    console.log(`✅ [${tenantId}] Mensaje enviado a ${phone}`);
    return true;
  } catch (error) {
    console.error(`❌ [${tenantId}] Error enviando:`, error.message);
    return false;
  }
}

// Inicializar WhatsApp para un tenant
async function initWhatsAppForTenant(tenantId) {
  console.log(`📱 [${tenantId}] Inicializando WhatsApp...`);
  
  const authFolder = `auth_sessions/${tenantId}`;
  
  // Crear carpeta si no existe
  if (!fs.existsSync(authFolder)) {
    fs.mkdirSync(authFolder, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: false,
    // Habilitar getMessage para el store
    getMessage: async (key) => {
      return undefined;
    },
  });

  const conn = {
    sock,
    qr: null,
    phone: null,
    tenantId
  };

  connections.set(tenantId, conn);

  // Evento: QR Code
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log(`📱 [${tenantId}] QR generado`);
      conn.qr = qr;
    }

    if (connection === 'close') {
      conn.qr = null;
      const shouldReconnect = lastDisconnect?.error instanceof Boom &&
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
      
      console.log(`❌ [${tenantId}] Conexión cerrada`);
      
      if (shouldReconnect) {
        console.log(`🔄 [${tenantId}] Reconectando...`);
        setTimeout(() => initWhatsAppForTenant(tenantId), 3000);
      } else {
        // Logout - eliminar conexión
        connections.delete(tenantId);
      }
    } else if (connection === 'open') {
      console.log(`✅ [${tenantId}] WhatsApp conectado`);
      conn.qr = null;
      conn.phone = sock.user?.id;
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // Evento: Mensajes nuevos
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      try {
        // Ignorar mensajes propios y de grupos
        if (msg.key.fromMe || msg.key.remoteJid?.includes('@g.us')) continue;

        // Extraer texto
        let text = null;
        if (msg.message?.conversation) {
          text = msg.message.conversation;
        } else if (msg.message?.extendedTextMessage?.text) {
          text = msg.message.extendedTextMessage.text;
        }

        if (!text) continue;

        // Obtener número real del contacto
        let phoneNumber = null;
        let originalJid = msg.key.remoteJid;
        let contactName = msg.pushName || msg.verifiedBizName || null;
        let isPrivateNumber = false; // Flag para números privados
        
        console.log(`🔍 [${tenantId}] ========== NUEVO MENSAJE ==========`);
        console.log(`🔍 [${tenantId}] RAW JID:`, originalJid);
        console.log(`🔍 [${tenantId}] pushName:`, contactName);
        console.log(`🔍 [${tenantId}] participant:`, msg.key.participant);
        
        // MÉTODO 1: Si el JID es @s.whatsapp.net, ya tenemos el número
        if (originalJid.includes('@s.whatsapp.net')) {
          phoneNumber = originalJid.replace('@s.whatsapp.net', '');
          console.log(`✅ [${tenantId}] Número directo:`, phoneNumber);
        }
        // MÉTODO 2: Si es @lid, FORZAR la obtención del número real
        else if (originalJid.includes('@lid')) {
          console.log(`⚠️  [${tenantId}] Detectado @lid, FORZANDO obtención de número real...`);
          
          // Intentar obtener del participant PRIMERO
          if (msg.key.participant && !msg.key.participant.includes('@lid')) {
            phoneNumber = msg.key.participant.replace('@s.whatsapp.net', '');
            originalJid = msg.key.participant; // Actualizar originalJid al participant
            console.log(`✅ [${tenantId}] Número desde participant:`, phoneNumber);
          }
          
          // Si no hay participant, intentar con onWhatsApp
          if (!phoneNumber) {
            try {
              const lidNumber = originalJid.replace('@lid', '');
              console.log(`🔍 [${tenantId}] Intentando onWhatsApp con:`, lidNumber);
              const result = await sock.onWhatsApp(lidNumber);
              console.log(`🔍 [${tenantId}] onWhatsApp result:`, JSON.stringify(result));
              
              if (result && result.length > 0 && result[0].jid) {
                if (!result[0].jid.includes('@lid')) {
                  phoneNumber = result[0].jid.replace('@s.whatsapp.net', '');
                  originalJid = result[0].jid; // Actualizar originalJid
                  console.log(`✅ [${tenantId}] Número desde onWhatsApp:`, phoneNumber);
                }
              }
            } catch (error) {
              console.log(`⚠️  [${tenantId}] Error en onWhatsApp:`, error.message);
            }
          }
          
          // Si NO se pudo resolver, marcar como número privado
          if (!phoneNumber) {
            isPrivateNumber = true;
            phoneNumber = originalJid.replace('@lid', '');
            console.log(`⚠️  [${tenantId}] NO SE PUDO RESOLVER @lid - Marcando como privado`);
            console.log(`⚠️  [${tenantId}] Se usará pushName como identificador: ${contactName}`);
            
            // Si no hay pushName, no guardar el mensaje
            if (!contactName) {
              console.log(`❌ [${tenantId}] Sin pushName - IGNORANDO mensaje de @lid sin resolver`);
              continue;
            }
          }
        }
        
        // TODO: Reactivar cuando se ejecute la migración de profilePicUrl
        // Intentar obtener foto de perfil
        // try {
        //   const jidToUse = phoneNumber ? `${phoneNumber}@s.whatsapp.net` : originalJid;
        //   console.log(`📸 [${tenantId}] Intentando obtener foto de perfil de:`, jidToUse);
        //   profilePicUrl = await sock.profilePictureUrl(jidToUse, 'image');
        //   console.log(`✅ [${tenantId}] Foto de perfil obtenida:`, profilePicUrl ? 'Sí' : 'No');
        // } catch (error) {
        //   console.log(`⚠️  [${tenantId}] No se pudo obtener foto de perfil:`, error.message);
        // }
        
        const cleanPhone = normalizePhone(phoneNumber || originalJid);
        
        console.log(`📨 [${tenantId}] FINAL - Phone: ${cleanPhone}, Name: ${contactName || 'Sin nombre'}, Private: ${isPrivateNumber}`);
        console.log(`📨 [${tenantId}] Mensaje: ${text.substring(0, 30)}...`);
        console.log(`🔍 [${tenantId}] ========================================`);

        // Guardar en backend con nombre y JID original
        await saveMessage(tenantId, cleanPhone, text, '', contactName, originalJid);

        // Verificar si el bot debe responder automáticamente
        const botShouldRespond = await shouldBotRespond(tenantId);
        
        if (botShouldRespond) {
          console.log(`🤖 [${tenantId}] Bot activo - generando respuesta...`);
          
          // Generar respuesta con IA
          const botResponse = await generateBotResponse(tenantId, text);
          
          if (botResponse) {
            // Enviar respuesta
            const sent = await sendMessage(tenantId, originalJid, botResponse);
            
            if (sent) {
              // Actualizar mensaje con la respuesta
              await saveMessage(tenantId, cleanPhone, text, botResponse, contactName, originalJid);
              console.log(`✅ [${tenantId}] Respuesta enviada`);
            }
          }
        } else {
          console.log(`⏭️  [${tenantId}] Bot inactivo - solo guardado`);
        }

      } catch (error) {
        console.error(`❌ [${tenantId}] Error procesando mensaje:`, error.message);
      }
    }
  });
}

// Servidor HTTP
const app = express();
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  const stats = {
    status: 'ok',
    connections: connections.size,
    tenants: Array.from(connections.keys()).map(tenantId => ({
      tenantId,
      connected: connections.get(tenantId)?.sock?.user ? true : false,
      phone: connections.get(tenantId)?.phone
    }))
  };
  res.json(stats);
});

// Conectar tenant (escanear QR)
app.post('/api/connect', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'];
  
  console.log(`📥 [CONNECT] Headers:`, req.headers);
  console.log(`📥 [CONNECT] Tenant ID:`, tenantId);
  
  if (!tenantId) {
    console.error(`❌ [CONNECT] Falta X-Tenant-ID header`);
    return res.status(400).json({ error: 'X-Tenant-ID header requerido' });
  }

  try {
    // Si ya existe conexión, retornar estado
    if (connections.has(tenantId)) {
      const conn = connections.get(tenantId);
      if (conn.sock?.user) {
        return res.json({ 
          connected: true, 
          phone: conn.phone 
        });
      }
    }

    // Iniciar nueva conexión
    await initWhatsAppForTenant(tenantId);
    
    res.json({ 
      success: true, 
      message: 'Conexión iniciada. Escanea el QR.' 
    });
  } catch (error) {
    console.error(`❌ Error conectando tenant ${tenantId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener QR Code
app.get('/api/qr', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'];
  
  console.log(`📥 [QR] Headers:`, req.headers);
  console.log(`📥 [QR] Tenant ID:`, tenantId);
  
  if (!tenantId) {
    console.error(`❌ [QR] Falta X-Tenant-ID header`);
    return res.status(400).json({ error: 'X-Tenant-ID header requerido' });
  }

  const conn = connections.get(tenantId);
  
  if (!conn) {
    return res.json({ connected: false, qrCode: null });
  }

  if (conn.qr) {
    // Retornar el QR string crudo para que el frontend lo convierta
    // Esto evita el error "too big to be stored in a QR Code"
    res.json({ qrCode: conn.qr, connected: false, raw: true });
  } else if (conn.sock?.user) {
    res.json({ connected: true, phone: conn.phone });
  } else {
    res.json({ connected: false, qrCode: null });
  }
});

// Enviar mensaje
app.post('/api/send-message', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'];
  const { phone, message } = req.body;
  
  console.log(`📥 [SEND-MESSAGE] Headers:`, req.headers);
  console.log(`📥 [SEND-MESSAGE] Body:`, { phone, message });
  console.log(`📥 [SEND-MESSAGE] Tenant ID:`, tenantId);
  
  if (!tenantId) {
    console.error(`❌ [SEND-MESSAGE] Falta X-Tenant-ID header`);
    return res.status(400).json({ error: 'X-Tenant-ID header requerido' });
  }
  
  if (!phone || !message) {
    console.error(`❌ [SEND-MESSAGE] Faltan phone o message`);
    return res.status(400).json({ error: 'phone y message requeridos' });
  }

  // El phone puede venir como número normalizado o como JID (@lid o @s.whatsapp.net)
  // Si no tiene @, agregamos @s.whatsapp.net
  let jid = phone;
  if (!phone.includes('@')) {
    jid = phone + '@s.whatsapp.net';
  }
  
  console.log(`📤 [${tenantId}] Enviando a: ${jid}`);
  const sent = await sendMessage(tenantId, jid, message);
  
  if (sent) {
    const cleanPhone = normalizePhone(jid);
    await saveMessage(tenantId, cleanPhone, '[CRM]', message, null, jid);
    res.json({ success: true });
  } else {
    console.error(`❌ [${tenantId}] Error enviando mensaje`);
    res.status(500).json({ success: false, error: 'Error enviando mensaje' });
  }
});

// Logout
app.post('/api/logout', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'];
  
  console.log(`📥 [LOGOUT] Headers:`, req.headers);
  console.log(`📥 [LOGOUT] Tenant ID:`, tenantId);
  
  if (!tenantId) {
    console.error(`❌ [LOGOUT] Falta X-Tenant-ID header`);
    return res.status(400).json({ error: 'X-Tenant-ID header requerido' });
  }

  try {
    const conn = connections.get(tenantId);
    if (conn?.sock) {
      await conn.sock.logout();
    }
    
    // Eliminar carpeta de sesión
    const authFolder = `auth_sessions/${tenantId}`;
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
    }
    
    connections.delete(tenantId);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener lista de grupos (TODOS los grupos, no solo admin)
app.get('/api/groups', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'];
  
  console.log(`📥 [GROUPS] Headers:`, req.headers);
  console.log(`📥 [GROUPS] Tenant ID:`, tenantId);
  
  if (!tenantId) {
    console.error(`❌ [GROUPS] Falta X-Tenant-ID header`);
    return res.status(400).json({ error: 'X-Tenant-ID header requerido' });
  }

  const conn = connections.get(tenantId);
  
  if (!conn || !conn.sock) {
    console.log(`⚠️  [${tenantId}] No hay conexión de WhatsApp`);
    return res.json({ groups: [] });
  }

  try {
    console.log(`📋 [${tenantId}] Obteniendo grupos...`);
    
    // Obtener todos los chats de grupo
    const chats = await conn.sock.groupFetchAllParticipating();
    console.log(`📋 [${tenantId}] Total de grupos:`, Object.keys(chats).length);
    
    // Convertir a array simple con todos los grupos
    const groups = [];
    
    for (const [jid, chat] of Object.entries(chats)) {
      const participants = chat.participants || [];
      const myJid = conn.sock.user?.id;
      const me = participants.find(p => p.id === myJid);
      const isAdmin = me && (me.admin === 'admin' || me.admin === 'superadmin');
      
      groups.push({
        id: jid,
        name: chat.subject || 'Grupo sin nombre',
        participants: participants.length,
        isAdmin: isAdmin || false
      });
      
      console.log(`📋 [${tenantId}] Grupo: ${chat.subject} - Admin: ${isAdmin}`);
    }
    
    console.log(`✅ [${tenantId}] Total grupos: ${groups.length}`);
    res.json({ groups });
  } catch (error) {
    console.error(`❌ [${tenantId}] Error obteniendo grupos:`, error.message);
    res.json({ groups: [] });
  }
});

app.listen(BOT_PORT, () => {
  console.log(`🌐 API escuchando en puerto ${BOT_PORT}`);
  console.log(`📋 Esperando conexiones de tenants...`);
  
  // Reconectar sesiones existentes al iniciar
  console.log('🔄 Buscando sesiones guardadas...');
  if (fs.existsSync('auth_sessions')) {
    const tenants = fs.readdirSync('auth_sessions');
    console.log(`📁 Encontradas ${tenants.length} sesiones guardadas`);
    
    for (const tenantId of tenants) {
      const sessionPath = `auth_sessions/${tenantId}`;
      if (fs.existsSync(sessionPath) && fs.statSync(sessionPath).isDirectory()) {
        console.log(`🔌 Reconectando tenant: ${tenantId}`);
        initWhatsAppForTenant(tenantId).catch(err => {
          console.error(`❌ Error reconectando ${tenantId}:`, err.message);
        });
      }
    }
  } else {
    console.log('📁 No hay sesiones guardadas');
  }
});

process.on('SIGINT', () => {
  console.log('\n👋 Cerrando bot...');
  process.exit(0);
});
