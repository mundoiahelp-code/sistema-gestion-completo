import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  Browsers
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';

class WhatsAppClient {
  constructor() {
    this.sock = null;
    this.qrGenerated = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.currentQR = null;
    this.messageHandler = null; // Handler para procesar mensajes
    
    // MULTI-TENANT: Usar carpeta de auth específica por tenant
    this.tenantId = process.env.TENANT_ID || 'default';
    this.authFolder = this.tenantId === 'default' ? 'auth_info' : `auth_sessions/${this.tenantId}`;
    
    console.log(`📁 Usando carpeta de autenticación: ${this.authFolder}`);
  }

  // Método para setear el handler de mensajes
  setMessageHandler(handler) {
    this.messageHandler = handler;
    console.log('✅ MessageHandler configurado');
  }

  // Método para eliminar la sesión guardada
  async deleteSession() {
    try {
      if (fs.existsSync(this.authFolder)) {
        // Eliminar todos los archivos de la carpeta de autenticación
        const files = fs.readdirSync(this.authFolder);
        for (const file of files) {
          fs.unlinkSync(path.join(this.authFolder, file));
        }
        // Eliminar la carpeta
        fs.rmdirSync(this.authFolder);
        console.log(`🗑️  Sesión eliminada: ${this.authFolder}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error eliminando sesión:', error);
      throw error;
    }
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
        getMessage: async (key) => {
          // Retornar undefined para mensajes que no tenemos en cache
          return undefined;
        },
        retryRequestDelayMs: 250,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
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

      // IMPORTANTE: Registrar eventos de mensajes AQUÍ
      this.sock.ev.on('messages.upsert', async ({ messages, type }) => {
        console.log(`📨 Evento: ${type}, mensajes: ${messages.length}`);
        
        // Solo procesar mensajes nuevos (notify)
        if (type !== 'notify') {
          console.log(`⏭️  Ignorando tipo: ${type}`);
          return;
        }
        
        for (const message of messages) {
          try {
            // Ignorar mensajes propios
            if (message.key.fromMe) {
              console.log('⏭️  Mensaje propio');
              continue;
            }

            // Ignorar mensajes de grupos
            if (message.key.remoteJid?.includes('@g.us')) {
              console.log('⏭️  Mensaje de grupo');
              continue;
            }

            // Verificar que tenga mensaje
            if (!message.message) {
              console.log('⏭️  Sin message');
              continue;
            }

            // IMPORTANTE: Ignorar eventos de protocolo/sistema que NO tienen texto
            const messageKeys = Object.keys(message.message);
            console.log('🔑 Keys:', messageKeys.join(', '));
            
            // Si SOLO tiene protocolMessage o messageContextInfo, ignorar
            const hasOnlyMetadata = messageKeys.every(key => 
              key === 'protocolMessage' || 
              key === 'messageContextInfo' ||
              key === 'senderKeyDistributionMessage'
            );
            
            if (hasOnlyMetadata) {
              console.log('⏭️  Solo metadata, sin texto');
              continue;
            }

            // Extraer texto del mensaje
            let messageText = null;
            
            if (message.message.conversation) {
              messageText = message.message.conversation;
              console.log('✅ Texto de conversation');
            } else if (message.message.extendedTextMessage?.text) {
              messageText = message.message.extendedTextMessage.text;
              console.log('✅ Texto de extendedTextMessage');
            } else if (message.message.imageMessage?.caption) {
              messageText = message.message.imageMessage.caption;
              console.log('✅ Texto de imageMessage');
            } else if (message.message.videoMessage?.caption) {
              messageText = message.message.videoMessage.caption;
              console.log('✅ Texto de videoMessage');
            } else {
              console.log('⏭️  No hay texto extraíble');
              continue;
            }

            // Si no hay texto, ignorar
            if (!messageText || messageText.trim() === '') {
              console.log('⏭️  Texto vacío');
              continue;
            }

            // Obtener número de teléfono
            let phoneNumber = message.key.remoteJid;
            let customerName = message.pushName || null;
            
            // Si viene con @lid, es un número encriptado por privacidad de WhatsApp
            if (phoneNumber?.includes('@lid')) {
              console.log('⚠️  Número con @lid (encriptado):', phoneNumber);
              
              // Intentar obtener del participant (en grupos)
              const participant = message.key.participant || message.participant;
              if (participant && !participant.includes('@lid')) {
                phoneNumber = participant;
                console.log('✅ Usando participant:', phoneNumber);
              } else {
                // Para @lid, usar el número encriptado tal cual
                // NO intentar extraer porque el número antes del @ es inválido
                console.log('ℹ️  Usando @lid completo (número privado)');
                // phoneNumber ya tiene el valor correcto con @lid
              }
            }
            
            console.log(`💬 [${this.tenantId}] ${customerName || phoneNumber}: "${messageText}"`);

            // Llamar al handler
            if (this.messageHandler) {
              await this.messageHandler(phoneNumber, messageText, this, customerName);
            } else {
              console.log('⚠️  Sin messageHandler');
            }
          } catch (error) {
            console.error('❌ Error:', error.message);
          }
        }
      });

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
