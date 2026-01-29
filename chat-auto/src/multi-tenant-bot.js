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

const BACKEND_URL = process.env.BACKEND_URL || 'https://distcba.gestion-completo.production-88bc.up.railway.app';
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
async function saveMessage(tenantId, phone, message, response = '') {
  try {
    const cleanPhone = normalizePhone(phone);
    
    const result = await axios.post(
      `${BACKEND_URL}/bot/messages`,
      {
        customerPhone: cleanPhone,
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
    
    console.log(`✅ [${tenantId}] Guardado: ${cleanPhone} - "${message.substring(0, 30)}..."`);
    return true;
  } catch (error) {
    console.error(`❌ [${tenantId}] Error guardando:`, error.response?.data || error.message);
    return false;
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

        // Obtener número - LOG DETALLADO
        let phone = msg.key.remoteJid;
        console.log(`🔍 [${tenantId}] Número RAW:`, phone);
        console.log(`🔍 [${tenantId}] Participant:`, msg.key.participant);
        
        // Si viene con @lid, intentar obtener el número real
        if (phone?.includes('@lid')) {
          console.log(`⚠️  [${tenantId}] Detectado @lid, intentando obtener número real...`);
          
          try {
            // Intentar obtener info del contacto
            const [contactInfo] = await sock.onWhatsApp(phone.replace('@lid', ''));
            if (contactInfo?.jid) {
              phone = contactInfo.jid;
              console.log(`✅ [${tenantId}] Número real obtenido:`, phone);
            } else {
              // Si no se puede obtener, usar el @lid convertido
              const match = phone.match(/^(\d+)@lid/);
              if (match) {
                phone = match[1] + '@s.whatsapp.net';
                console.log(`🔄 [${tenantId}] Usando @lid convertido:`, phone);
              } else {
                console.log(`❌ [${tenantId}] No se pudo procesar @lid`);
                continue;
              }
            }
          } catch (error) {
            console.log(`❌ [${tenantId}] Error obteniendo número real:`, error.message);
            // Fallback: usar el @lid convertido
            const match = phone.match(/^(\d+)@lid/);
            if (match) {
              phone = match[1] + '@s.whatsapp.net';
              console.log(`🔄 [${tenantId}] Fallback a @lid convertido:`, phone);
            } else {
              continue;
            }
          }
        }

        const cleanPhone = normalizePhone(phone);
        console.log(`📨 [${tenantId}] ${cleanPhone}: ${text}`);

        // Guardar en backend
        await saveMessage(tenantId, cleanPhone, text);

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
  
  if (!tenantId) {
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
  
  if (!tenantId) {
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
  
  if (!tenantId) {
    return res.status(400).json({ error: 'X-Tenant-ID header requerido' });
  }
  
  if (!phone || !message) {
    return res.status(400).json({ error: 'phone y message requeridos' });
  }

  const cleanPhone = normalizePhone(phone);
  const sent = await sendMessage(tenantId, cleanPhone, message);
  
  if (sent) {
    await saveMessage(tenantId, cleanPhone, '[CRM]', message);
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false });
  }
});

// Logout
app.post('/api/logout', async (req, res) => {
  const tenantId = req.headers['x-tenant-id'];
  
  if (!tenantId) {
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

app.listen(BOT_PORT, () => {
  console.log(`🌐 API escuchando en puerto ${BOT_PORT}`);
  console.log(`📋 Esperando conexiones de tenants...`);
});

process.on('SIGINT', () => {
  console.log('\n👋 Cerrando bot...');
  process.exit(0);
});
