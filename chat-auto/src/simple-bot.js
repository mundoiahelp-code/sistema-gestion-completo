import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState 
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import axios from 'axios';
import express from 'express';

// Configuración
const TENANT_ID = process.env.TENANT_ID || '64670744-ed81-4eaa-b0b4-6a6871e7cd10';
const BACKEND_URL = process.env.BACKEND_URL || 'https://distcba.gestion-completo.production-88bc.up.railway.app';
const BOT_PORT = process.env.BOT_API_PORT || 3001;

console.log('🤖 Bot Simple - Iniciando...');
console.log(`📋 Tenant ID: ${TENANT_ID}`);
console.log(`🌐 Backend: ${BACKEND_URL}`);

let sock = null;
let currentQR = null;

// Función para guardar mensaje en el backend
async function saveMessage(phone, message, response = '') {
  try {
    console.log(`💾 Guardando: ${phone} - "${message}"`);
    
    const result = await axios.post(
      `${BACKEND_URL}/bot/messages`,
      {
        customerPhone: phone,
        message: message,
        response: response,
        intent: 'RECIBIDO',
        status: response ? 'responded' : 'pending',
        platform: 'whatsapp'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': TENANT_ID
        }
      }
    );
    
    console.log(`✅ Guardado en CRM`);
    return true;
  } catch (error) {
    console.error(`❌ Error guardando:`, error.response?.data || error.message);
    return false;
  }
}

// Función para enviar mensaje
async function sendMessage(phone, message) {
  if (!sock) {
    console.error('❌ WhatsApp no conectado');
    return false;
  }
  
  try {
    const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    console.log(`✅ Mensaje enviado a ${phone}`);
    return true;
  } catch (error) {
    console.error(`❌ Error enviando:`, error.message);
    return false;
  }
}

// Inicializar WhatsApp
async function initWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
  });

  // Evento: QR Code
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 Escanea este QR:\n');
      qrcode.generate(qr, { small: true });
      currentQR = qr;
    }

    if (connection === 'close') {
      currentQR = null;
      const shouldReconnect = lastDisconnect?.error instanceof Boom &&
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
      
      console.log('❌ Conexión cerrada');
      if (shouldReconnect) {
        console.log('🔄 Reconectando...');
        setTimeout(initWhatsApp, 3000);
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp conectado');
      currentQR = null;
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

        // Obtener número
        let phone = msg.key.remoteJid;
        
        // Manejar @lid
        if (phone?.includes('@lid')) {
          const match = phone.match(/^(\d+)@lid/);
          if (match) {
            phone = match[1] + '@s.whatsapp.net';
          } else {
            continue;
          }
        }

        console.log(`📨 ${phone}: ${text}`);

        // Guardar en backend
        await saveMessage(phone, text);

      } catch (error) {
        console.error('❌ Error procesando mensaje:', error.message);
      }
    }
  });
}

// Servidor HTTP
const app = express();
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    connected: sock?.user ? true : false,
    tenantId: TENANT_ID
  });
});

// QR Code
app.get('/api/qr', (req, res) => {
  if (currentQR) {
    res.json({ qrCode: currentQR, connected: false });
  } else if (sock?.user) {
    res.json({ connected: true, phone: sock.user.id });
  } else {
    res.json({ connected: false, qrCode: null });
  }
});

// Enviar mensaje
app.post('/api/send-message', async (req, res) => {
  const { phone, message } = req.body;
  
  if (!phone || !message) {
    return res.status(400).json({ error: 'phone y message requeridos' });
  }

  const sent = await sendMessage(phone, message);
  
  if (sent) {
    await saveMessage(phone, '[CRM]', message);
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false });
  }
});

// Logout
app.post('/api/logout', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
      sock = null;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(BOT_PORT, () => {
  console.log(`🌐 API escuchando en puerto ${BOT_PORT}`);
});

// Iniciar
initWhatsApp().catch(console.error);

process.on('SIGINT', () => {
  console.log('\n👋 Cerrando bot...');
  process.exit(0);
});
