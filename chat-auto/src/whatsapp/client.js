import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  Browsers
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

class WhatsAppClient {
  constructor() {
    this.sock = null;
    this.qrGenerated = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.currentQR = null;
    
    // MULTI-TENANT: Usar carpeta de auth específica por tenant
    this.tenantId = process.env.TENANT_ID || 'default';
    this.authFolder = this.tenantId === 'default' ? 'auth_info' : `auth_sessions/${this.tenantId}`;
    
    console.log(`📁 Usando carpeta de autenticación: ${this.authFolder}`);
  }

  async initialize() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);

      this.sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['Chrome (Linux)', '', ''],
        printQRInTerminal: false,
        syncFullHistory: false,
        markOnlineOnConnect: true,
        defaultQueryTimeoutMs: undefined,
        getMessage: async () => undefined,
        retryRequestDelayMs: 250,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        emitOwnEvents: false,
        fireInitQueries: true,
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        markOnlineOnConnect: false,
      });

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('\n📱 Escanea este QR con WhatsApp:\n');
          qrcode.generate(qr, { small: true });
          console.log('\n👆 Escanea el código QR con tu WhatsApp\n');
          this.qrGenerated = true;
          // Guardar QR para exponerlo en el endpoint
          this.currentQR = qr;
        }

        if (connection === 'close') {
          // Limpiar QR cuando se cierra la conexión
          this.currentQR = null;
          
          const statusCode = lastDisconnect?.error instanceof Boom 
            ? lastDisconnect.error.output.statusCode 
            : null;
          
          // Códigos que requieren reinicio manual
          const criticalErrors = [
            DisconnectReason.loggedOut,
            440, // Conflict
            401, // Stream Errored (conflict)
          ];

          const shouldReconnect = !criticalErrors.includes(statusCode) && 
                                  this.reconnectAttempts < this.maxReconnectAttempts;

          console.log('❌ Conexión cerrada.');
          console.log('   Código:', statusCode);
          console.log('   Razón:', lastDisconnect?.error?.message || 'Desconocida');
          
          if (criticalErrors.includes(statusCode)) {
            console.log('🚪 Sesión cerrada, necesita escanear QR nuevamente');
            console.log('   Reinicia el bot con: npm start');
            return;
          }

          console.log('   Reconectando:', shouldReconnect);
          console.log('   Intentos:', this.reconnectAttempts + 1, '/', this.maxReconnectAttempts);

          if (shouldReconnect) {
            this.reconnectAttempts++;
            // Esperar más tiempo entre reconexiones
            const delay = Math.min(5000 * this.reconnectAttempts, 30000);
            console.log(`   Esperando ${delay/1000}s antes de reconectar...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            await this.initialize();
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('❌ Máximo de intentos de reconexión alcanzado.');
            console.log('   Reinicia el bot manualmente.');
          }
        } else if (connection === 'open') {
          console.log('✅ WhatsApp conectado correctamente');
          this.qrGenerated = false;
          this.reconnectAttempts = 0; // Reset counter on successful connection
          // Limpiar QR cuando se conecta exitosamente
          this.currentQR = null;
        }
      });

      this.sock.ev.on('creds.update', saveCreds);

      return this.sock;
    } catch (error) {
      console.error('❌ Error al inicializar WhatsApp:', error);
      throw error;
    }
  }

  async sendMessage(phoneNumber, message, simulateTyping = true, retries = 3) {
    // Verificar que el socket esté conectado
    if (!this.sock || !this.sock.user) {
      console.error('❌ WhatsApp no está conectado. Escanea el QR primero.');
      return false;
    }

    const jid = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@s.whatsapp.net`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (simulateTyping) {
          // Mostrar "escribiendo..." por un tiempo random (2-4 segundos)
          await this.sock.sendPresenceUpdate('composing', jid);
          const typingDelay = 2000 + Math.random() * 2000;
          await new Promise(resolve => setTimeout(resolve, typingDelay));
          await this.sock.sendPresenceUpdate('paused', jid);
        }
        
        await this.sock.sendMessage(jid, { text: message });
        console.log(`✅ Mensaje enviado a ${phoneNumber}`);
        return true;
      } catch (error) {
        console.error(`❌ Error al enviar mensaje (intento ${attempt}/${retries}):`, error.message);
        
        if (attempt < retries) {
          // Esperar antes de reintentar (1, 2, 3 segundos)
          const waitTime = attempt * 1000;
          console.log(`⏳ Reintentando en ${waitTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          console.error('❌ No se pudo enviar el mensaje después de', retries, 'intentos');
          return false;
        }
      }
    }
    
    return false;
  }

  async sendMessages(phoneNumber, messages, delay = 1000) {
    for (const message of messages) {
      await this.sendMessage(phoneNumber, message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  async sendGroupMessage(chatId, message, retries = 3) {
    // Verificar que el socket esté conectado
    if (!this.sock || !this.sock.user) {
      console.error('❌ WhatsApp no está conectado. Escanea el QR primero.');
      return false;
    }

    // chatId ya viene en formato correcto (ej: 123456789@g.us)
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.sock.sendMessage(chatId, { text: message });
        console.log(`✅ Mensaje enviado a grupo ${chatId}`);
        return true;
      } catch (error) {
        console.error(`❌ Error al enviar mensaje a grupo (intento ${attempt}/${retries}):`, error.message);
        
        if (attempt < retries) {
          const waitTime = attempt * 1000;
          console.log(`⏳ Reintentando en ${waitTime/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          console.error('❌ No se pudo enviar el mensaje al grupo después de', retries, 'intentos');
          return false;
        }
      }
    }
    
    return false;
  }

  getSocket() {
    return this.sock;
  }
}

export default WhatsAppClient;
