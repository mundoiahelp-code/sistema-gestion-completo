import makeWASocket, {
  DisconnectReason,
  WASocket,
  jidNormalizedUser,
  isLidUser,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { chatbotService } from './chatbot.service';
import { usePostgresAuthState, clearPostgresAuthState } from '../lib/whatsapp-auth-store';

class WhatsAppService {
  private socket: WASocket | null = null;
  private qrCode: string | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  // Mapa para guardar LID -> número real
  private lidToPhoneMap = new Map<string, string>();
  // Store de contactos manual
  private contacts = new Map<string, { id: string; name?: string; phone?: string }>();
  // Número del negocio (el que escaneó el QR) - usado para identificar el tenant
  private businessPhoneNumber: string = '';
  // Cache de puertos de bots por tenant (para evitar consultas a DB)
  private tenantBotPortCache = new Map<string, { port: number; name: string; timestamp: number }>();
  private readonly CACHE_TTL = 60000; // 1 minuto

  // Obtener el número del negocio
  getBusinessPhoneNumber(): string {
    return this.businessPhoneNumber;
  }

  async initialize(): Promise<void> {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      // Usar autenticación desde PostgreSQL
      const { state, saveCreds } = await usePostgresAuthState();

      this.socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        browser: ['Sistema de Gestion', 'Chrome', '1.0.0'],
        logger: pino({ level: 'silent' }),
      });

      this.socket.ev.on('creds.update', saveCreds);

      this.socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCode = qr;
          console.log('\n📱 Escaneá este QR con WhatsApp:\n');
          qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
          this.isConnected = false;
          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut;

          console.log(
            '❌ Conexión cerrada:',
            lastDisconnect?.error?.message || 'Unknown'
          );

          if (shouldReconnect) {
            console.log('🔄 Reconectando...');
            this.isConnecting = false;
            setTimeout(() => this.initialize(), 5000);
          } else {
            console.log('🚪 Sesión cerrada, necesita escanear QR nuevamente');
            this.qrCode = null;
          }
        } else if (connection === 'open') {
          this.isConnected = true;
          this.qrCode = null;
          console.log('✅ WhatsApp conectado!');
          
          // Guardar el número del negocio (el que escaneó el QR)
          if (this.socket?.user?.id) {
            this.businessPhoneNumber = this.socket.user.id.split(':')[0].split('@')[0];
            console.log(`📱 Número del negocio: ${this.businessPhoneNumber}`);
          }
          
          // Intentar cargar mapeos LID existentes del signalRepository
          try {
            const signalRepo = (this.socket as any)?.signalRepository;
            if (signalRepo?.lidMapping) {
              console.log('📱 LID Mapping disponible en signalRepository');
            }
          } catch (e) {
            // Ignorar
          }
        }
      });

      // Escuchar eventos de messaging-history para capturar mapeos LID-PN
      this.socket.ev.on('messaging-history.set', async (data) => {
        try {
          const { contacts: historyContacts } = data;
          if (historyContacts && historyContacts.length > 0) {
            console.log(`📜 Historial recibido con ${historyContacts.length} contactos`);
            for (const contact of historyContacts) {
              const id = contact.id;
              if (id && id.includes('@s.whatsapp.net')) {
                const phone = id.split('@')[0];
                if (phone.match(/^\d{10,15}$/)) {
                  this.lidToPhoneMap.set(id, phone);
                  // Si tiene LID asociado, guardarlo también
                  if ((contact as any).lid) {
                    this.lidToPhoneMap.set((contact as any).lid, phone);
                    console.log(`📝 Historial: LID ${(contact as any).lid} -> ${phone}`);
                  }
                }
              }
            }
          }
        } catch (e) {
          // Ignorar errores
        }
      });

      // Capturar contactos cuando se actualizan
      this.socket.ev.on('contacts.update', (contacts) => {
        console.log(`📇 Contactos actualizados: ${contacts.length}`);
        for (const contact of contacts) {
          if (contact.id) {
            const lid = contact.id;
            // Guardar en nuestro store
            this.contacts.set(lid, {
              id: lid,
              name: (contact as any).notify || (contact as any).name,
              phone: lid.includes('@s.whatsapp.net') ? lid.split('@')[0] : undefined
            });
            // Si el ID tiene formato de número real, guardarlo
            if (lid.includes('@s.whatsapp.net')) {
              const phone = lid.split('@')[0];
              if (phone.match(/^\d{10,15}$/)) {
                this.lidToPhoneMap.set(lid, phone);
                console.log(`📝 Contacto mapeado: ${lid} -> ${phone}`);
              }
            }
          }
        }
      });

      // Capturar contactos nuevos
      this.socket.ev.on('contacts.upsert', (contacts) => {
        console.log(`📇 Nuevos contactos: ${contacts.length}`);
        for (const contact of contacts) {
          const id = contact.id;
          // Guardar en nuestro store
          this.contacts.set(id, {
            id: id,
            name: (contact as any).notify || (contact as any).name,
            phone: id.includes('@s.whatsapp.net') ? id.split('@')[0] : undefined
          });
          // Extraer número del JID si es posible
          if (id && id.includes('@s.whatsapp.net')) {
            const phone = id.split('@')[0];
            if (phone.match(/^\d{10,15}$/)) {
              this.lidToPhoneMap.set(id, phone);
              // También guardar el LID si existe
              if ((contact as any).lid) {
                this.lidToPhoneMap.set((contact as any).lid, phone);
                console.log(`📝 LID mapeado: ${(contact as any).lid} -> ${phone}`);
              }
            }
          }
        }
      });

      // Sistema de acumulación de mensajes por cliente
      const pendingMessages = new Map<string, { 
        messages: string[], 
        pushName: string, 
        phoneNumber: string,
        timer: NodeJS.Timeout | null 
      }>();
      const processedMessageIds = new Set<string>();
      const WAIT_TIME = 10000; // Esperar 10 segundos antes de responder
      const respondingTo = new Set<string>(); // Evitar respuestas duplicadas
      
      // Handler de mensajes entrantes para el chatbot
      this.socket.ev.on('messages.upsert', async ({ messages, type }) => {
        for (const message of messages) {
          try {
            // Evitar procesar mensajes duplicados
            const messageId = message.key.id;
            if (messageId && processedMessageIds.has(messageId)) continue;
            if (messageId) {
              processedMessageIds.add(messageId);
              setTimeout(() => processedMessageIds.delete(messageId), 5 * 60 * 1000);
            }
            
            // Ignorar mensajes propios y de grupos
            if (message.key.fromMe) continue;
            if (message.key.remoteJid?.includes('@g.us')) continue;

            const remoteJid = message.key.remoteJid || '';
            const pushName = (message as any).pushName || '';
            
            // Obtener texto del mensaje
            const messageText = message.message?.conversation ||
                              message.message?.extendedTextMessage?.text ||
                              message.message?.imageMessage?.caption ||
                              message.message?.videoMessage?.caption;

            if (!messageText) continue;

            // Obtener número de teléfono - MEJORADO con LID Mapping
            let phoneNumber = '';
            if (isLidUser(remoteJid)) {
              console.log(`🔍 Detectado LID: ${remoteJid}, buscando número real...`);
              
              // 1. Primero intentar del mapa local (cache)
              phoneNumber = this.lidToPhoneMap.get(remoteJid) || '';
              if (phoneNumber) {
                console.log(`✅ Número encontrado en cache: ${phoneNumber}`);
              }
              
              // 2. Usar el LID Mapping interno de Baileys (la forma correcta!)
              if (!phoneNumber && this.socket) {
                try {
                  // Acceder al signalRepository que tiene el lidMapping
                  const signalRepo = (this.socket as any).signalRepository;
                  if (signalRepo?.lidMapping) {
                    const pnJid = await signalRepo.lidMapping.getPNForLID(remoteJid);
                    if (pnJid) {
                      // pnJid viene en formato "5491112345678:0@s.whatsapp.net"
                      phoneNumber = pnJid.split('@')[0].split(':')[0];
                      if (phoneNumber.match(/^\d{10,15}$/)) {
                        this.lidToPhoneMap.set(remoteJid, phoneNumber);
                        console.log(`✅ Número obtenido via LID Mapping: ${phoneNumber}`);
                      }
                    }
                  }
                } catch (e) {
                  console.log(`⚠️ Error en LID Mapping:`, e);
                }
              }
              
              // 3. Buscar en nuestro store de contactos
              if (!phoneNumber) {
                for (const [key, contact] of this.contacts) {
                  if (key === remoteJid && contact.phone) {
                    phoneNumber = contact.phone;
                    this.lidToPhoneMap.set(remoteJid, phoneNumber);
                    console.log(`✅ Número encontrado en store: ${phoneNumber}`);
                    break;
                  }
                }
              }
              
              // 4. Intentar obtener el número real usando onWhatsApp
              if (!phoneNumber && this.socket) {
                try {
                  const contact = await this.socket.onWhatsApp(remoteJid);
                  if (contact && contact.length > 0 && contact[0].jid) {
                    const realJid = contact[0].jid;
                    if (!isLidUser(realJid)) {
                      phoneNumber = realJid.split('@')[0];
                      this.lidToPhoneMap.set(remoteJid, phoneNumber);
                      console.log(`✅ Número obtenido via onWhatsApp: ${phoneNumber}`);
                    }
                  }
                } catch (e) {
                  // Ignorar error
                }
              }
              
              // 5. Intentar del participant del mensaje
              if (!phoneNumber) {
                const msgKey = message.key as any;
                if (msgKey.participant && !isLidUser(msgKey.participant)) {
                  phoneNumber = msgKey.participant.split('@')[0].replace(/\D/g, '');
                  if (phoneNumber && phoneNumber.match(/^\d{10,15}$/)) {
                    this.lidToPhoneMap.set(remoteJid, phoneNumber);
                    console.log(`✅ Número obtenido de participant: ${phoneNumber}`);
                  }
                }
              }
              
              // 6. Último recurso: marcar como LID (el bot pedirá el número)
              if (!phoneNumber || !phoneNumber.match(/^\d{10,15}$/)) {
                phoneNumber = 'LID_' + remoteJid.split('@')[0].split(':')[0];
                console.log(`⚠️ No se pudo obtener número real, usando marcador: ${phoneNumber}`);
              }
            } else {
              phoneNumber = jidNormalizedUser(remoteJid).split('@')[0];
              console.log(`✅ Número directo del JID: ${phoneNumber}`);
            }

            console.log(`📱 Mensaje de ${pushName || 'Sin nombre'} (${phoneNumber}): ${messageText}`);

            // SISTEMA DE ACUMULACIÓN: Esperar antes de responder
            const pending = pendingMessages.get(remoteJid) || { 
              messages: [] as string[], 
              pushName: pushName, 
              phoneNumber: phoneNumber,
              timer: null as NodeJS.Timeout | null
            };
            
            // Agregar mensaje a la cola
            pending.messages.push(messageText as string);
            if (pushName) pending.pushName = pushName;
            if (phoneNumber) pending.phoneNumber = phoneNumber;
            
            // Cancelar timer anterior si existe
            if (pending.timer) {
              clearTimeout(pending.timer);
            }
            
            // Crear nuevo timer para responder después de WAIT_TIME
            pending.timer = setTimeout(async () => {
              // Evitar respuestas duplicadas
              if (respondingTo.has(remoteJid)) {
                console.log(`⚠️ Ya respondiendo a ${remoteJid}, ignorando...`);
                return;
              }
              respondingTo.add(remoteJid);
              
              try {
                const allMessages = pending.messages.join(' '); // Unir con espacio, no con \n
                console.log(`📝 Procesando ${pending.messages.length} mensaje(s) de ${pending.pushName}: ${allMessages.substring(0, 100)}...`);
                
                // Limpiar cola
                pendingMessages.delete(remoteJid);
                
                // Procesar con el chatbot
                const response = await chatbotService.handleIncomingMessage(
                  remoteJid, 
                  allMessages, 
                  pending.pushName, 
                  pending.phoneNumber
                );
                
                if (response && this.socket) {
                  // TODO en UN SOLO mensaje - convertir [BR] a saltos de línea
                  const formattedMsg = response
                    .replace(/\[BR\]\[BR\]/g, '\n\n')  // Doble BR = doble salto
                    .replace(/\[BR\]/g, '\n')          // BR simple = salto simple
                    .trim();
                  
                  if (formattedMsg) {
                    // Mostrar "escribiendo..."
                    await this.socket.sendPresenceUpdate('composing', remoteJid);
                    
                    // Delay natural basado en longitud (mínimo 2s, máximo 4s)
                    const delay = Math.min(2000 + formattedMsg.length * 10, 4000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    
                    await this.socket.sendPresenceUpdate('paused', remoteJid);
                    await this.socket.sendMessage(remoteJid, { text: formattedMsg });
                    console.log(`✅ Mensaje enviado: ${formattedMsg.substring(0, 80)}...`);
                  }
                }
              } catch (error) {
                console.error('❌ Error procesando mensajes acumulados:', error);
              } finally {
                // Liberar después de 5 segundos para permitir nuevas respuestas
                setTimeout(() => respondingTo.delete(remoteJid), 5000);
              }
            }, WAIT_TIME);
            
            pendingMessages.set(remoteJid, pending);
            console.log(`⏳ Mensaje agregado a cola. Total: ${pending.messages.length}. Esperando ${WAIT_TIME/1000}s...`);
            
          } catch (error) {
            console.error('❌ Error procesando mensaje:', error);
          }
        }
      });
    } catch (error) {
      console.error('Error inicializando WhatsApp:', error);
    } finally {
      this.isConnecting = false;
    }
  }

  getQRCode(): string | null {
    return this.qrCode;
  }

  getStatus(): { connected: boolean; hasQR: boolean } {
    return {
      connected: this.isConnected,
      hasQR: !!this.qrCode,
    };
  }

  // Registrar mapeo de número a LID (para cuando conocemos ambos)
  registerPhoneToLid(phone: string, lid: string) {
    if (phone && lid) {
      this.lidToPhoneMap.set(lid, phone);
      console.log(`📝 Registrado mapeo: ${lid} -> ${phone}`);
    }
  }

  // Obtener número real de un LID
  getPhoneFromLid(lid: string): string | null {
    return this.lidToPhoneMap.get(lid) || null;
  }

  async sendMessage(phone: string, message: string, tenantId?: string): Promise<boolean> {
    // MULTI-TENANT: Si se proporciona tenantId, rutear al bot correcto
    if (tenantId) {
      return this.sendMessageViaTenantBot(tenantId, phone, message);
    }

    // Modo legacy: usar conexión directa (deprecado)
    if (!this.socket || !this.isConnected) {
      console.error(`❌ WhatsApp no está conectado - No se pudo enviar mensaje a ${phone}`);
      console.error(`📝 Mensaje que no se envió: ${message.substring(0, 100)}...`);
      return false;
    }

    try {
      // Limpiar número de caracteres no numéricos
      let formattedPhone = phone.replace(/\D/g, '');
      
      console.log(`📤 Enviando mensaje a: ${phone} -> limpio: ${formattedPhone}`);
      
      // Si el número empieza con 15, es un número argentino sin código de país
      if (formattedPhone.startsWith('15')) {
        formattedPhone = '5411' + formattedPhone.substring(2);
      } else if (formattedPhone.length === 10 && formattedPhone.startsWith('11')) {
        formattedPhone = '54' + formattedPhone;
      } else if (formattedPhone.length === 10) {
        formattedPhone = '54' + formattedPhone;
      } else if (formattedPhone.length === 11 && formattedPhone.startsWith('9')) {
        formattedPhone = '54' + formattedPhone;
      } else if (!formattedPhone.startsWith('54') && formattedPhone.length < 13) {
        formattedPhone = '54' + formattedPhone;
      }
      
      // Asegurar que números argentinos tengan el 9 después del 54 para celulares
      if (formattedPhone.startsWith('54') && !formattedPhone.startsWith('549') && formattedPhone.length === 12) {
        formattedPhone = '549' + formattedPhone.substring(2);
      }
      
      const jid = `${formattedPhone}@s.whatsapp.net`;
      console.log(`📱 JID final: ${jid}`);

      await this.socket.sendMessage(jid, { text: message });
      console.log(`✅ Mensaje enviado a ${jid}`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      return false;
    }
  }

  /**
   * MULTI-TENANT: Enviar mensaje a través del bot del tenant
   */
  private async sendMessageViaTenantBot(tenantId: string, phone: string, message: string): Promise<boolean> {
    try {
      // Verificar cache primero
      const cached = this.tenantBotPortCache.get(tenantId);
      let botPort: number;
      let tenantName: string;

      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        // Usar cache
        botPort = cached.port;
        tenantName = cached.name;
      } else {
        // Consultar base de datos
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { botPort: true, name: true }
        });

        await prisma.$disconnect();

        if (!tenant || !tenant.botPort) {
          console.error(`❌ Tenant ${tenantId} no tiene bot configurado`);
          return false;
        }

        botPort = tenant.botPort;
        tenantName = tenant.name;

        // Guardar en cache
        this.tenantBotPortCache.set(tenantId, {
          port: botPort,
          name: tenantName,
          timestamp: Date.now()
        });
      }

      // Enviar mensaje al bot del tenant usando axios (más rápido que fetch)
      const botUrl = `http://localhost:${botPort}/api/send-message`;
      console.log(`📤 [${tenantName}] Enviando mensaje a ${phone}`);

      const axios = require('axios');
      const response = await axios.post(botUrl, 
        { phone, message },
        { 
          timeout: 5000, // 5 segundos de timeout
          headers: { 'Content-Type': 'application/json' }
        }
      );

      console.log(`✅ [${tenantName}] Mensaje enviado`);
      return response.data.success || false;

    } catch (error: any) {
      console.error('❌ Error enviando mensaje:', error.message);
      return false;
    }
  }

  // Enviar mensaje a grupo o lista de difusión
  async sendMessageToGroup(chatId: string, message: string, tenantId?: string): Promise<boolean> {
    // MULTI-TENANT: Si se proporciona tenantId, rutear al bot correcto
    if (tenantId) {
      return this.sendGroupMessageViaTenantBot(tenantId, chatId, message);
    }

    // Modo legacy: usar conexión directa
    if (!this.socket || !this.isConnected) {
      console.error('❌ WhatsApp no está conectado');
      return false;
    }

    try {
      await this.socket.sendMessage(chatId, { text: message });
      console.log(`✅ Mensaje enviado a grupo ${chatId}`);
      return true;
    } catch (error) {
      console.error('❌ Error enviando mensaje a grupo:', error);
      return false;
    }
  }

  /**
   * MULTI-TENANT: Enviar mensaje a grupo a través del bot del tenant
   */
  private async sendGroupMessageViaTenantBot(tenantId: string, chatId: string, message: string): Promise<boolean> {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      // Buscar el puerto del bot del tenant
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { botPort: true, name: true }
      });

      await prisma.$disconnect();

      if (!tenant || !tenant.botPort) {
        console.error(`❌ Tenant ${tenantId} no tiene bot configurado`);
        return false;
      }

      // Enviar mensaje al bot del tenant
      const botUrl = `http://localhost:${tenant.botPort}/api/send-group-message`;
      console.log(`📤 [${tenant.name}] Enviando mensaje a grupo ${chatId} via bot en puerto ${tenant.botPort}`);

      const response = await fetch(botUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Error del bot: ${error}`);
        return false;
      }

      const result = await response.json() as { success?: boolean };
      console.log(`✅ [${tenant.name}] Mensaje enviado a grupo correctamente`);
      return result.success || false;

    } catch (error) {
      console.error('❌ Error enviando mensaje a grupo via tenant bot:', error);
      return false;
    }
  }

  // Enviar imagen por WhatsApp
  async sendImage(jid: string, imagePath: string, caption?: string): Promise<boolean> {
    if (!this.socket || !this.isConnected) {
      console.error('WhatsApp no está conectado');
      return false;
    }

    try {
      // Si es una URL local, leer el archivo
      let imageBuffer: Buffer;
      
      if (imagePath.startsWith('http')) {
        // Es una URL externa, descargar
        const response = await fetch(imagePath);
        imageBuffer = Buffer.from(await response.arrayBuffer());
      } else {
        // Es un path local
        const fullPath = path.join(process.cwd(), imagePath.replace(/^\//, ''));
        if (!fs.existsSync(fullPath)) {
          console.error('Imagen no encontrada:', fullPath);
          return false;
        }
        imageBuffer = fs.readFileSync(fullPath);
      }

      await this.socket.sendMessage(jid, {
        image: imageBuffer,
        caption: caption || ''
      });
      
      console.log(`📸 Imagen enviada a ${jid}`);
      return true;
    } catch (error) {
      console.error('Error enviando imagen:', error);
      return false;
    }
  }

  // Enviar múltiples imágenes
  async sendImages(jid: string, imagePaths: string[], caption?: string): Promise<boolean> {
    if (imagePaths.length === 0) return false;
    
    try {
      // Enviar primera imagen con caption
      await this.sendImage(jid, imagePaths[0], caption);
      
      // Enviar el resto sin caption (con delay más largo para que no parezca spam)
      for (let i = 1; i < imagePaths.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 segundos entre fotos
        await this.sendImage(jid, imagePaths[i]);
      }
      
      return true;
    } catch (error) {
      console.error('Error enviando imágenes:', error);
      return false;
    }
  }

  async getContactName(phone: string): Promise<string | null> {
    if (!this.socket || !this.isConnected) return null;

    try {
      let formattedPhone = phone.replace(/\D/g, '');
      if (!formattedPhone.startsWith('54')) {
        formattedPhone = '54' + formattedPhone;
      }
      const jid = `${formattedPhone}@s.whatsapp.net`;

      // Intentar obtener el nombre del contacto desde el store
      const contact = this.socket.store?.contacts?.[jid];
      if (contact && 'notify' in contact) {
        return (contact as { notify?: string }).notify || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('🚪 Cerrando sesión de WhatsApp...');
      
      // Cerrar socket si existe
      if (this.socket) {
        try {
          // Intentar cerrar sesión
          await this.socket.logout();
          console.log('✅ Socket desconectado');
        } catch (error) {
          console.log('⚠️ Error al desconectar socket (ignorando):', error);
        }
        
        try {
          // Limpiar listeners
          this.socket.removeAllListeners();
        } catch (error) {
          console.log('⚠️ Error al limpiar listeners (ignorando)');
        }
        
        this.socket = null;
      }
      
      // Resetear estados
      this.isConnected = false;
      this.isConnecting = false;
      this.qrCode = null;

      // Limpiar sesión de la base de datos
      await clearPostgresAuthState();
      
      console.log('✅ Sesión cerrada completamente');
    } catch (error) {
      console.error('❌ Error en logout:', error);
      // No lanzar el error, solo loguearlo
      console.log('⚠️ Continuando a pesar del error...');
    }
  }

  async forceNewQR(): Promise<void> {
    console.log('🔄 Forzando generación de nuevo QR...');
    
    // Cerrar socket actual si existe
    if (this.socket) {
      try {
        this.socket.removeAllListeners();
        this.socket = null;
      } catch (error) {
        console.log('⚠️ Error cerrando socket:', error);
      }
    }
    
    // Resetear estados
    this.isConnected = false;
    this.isConnecting = false;
    this.qrCode = null;
    
    // Limpiar sesión de la base de datos
    await clearPostgresAuthState();
    
    // Inicializar de nuevo
    await this.initialize();
  }

  async getGroups(): Promise<Array<{ id: string; name: string; participants: number }>> {
    if (!this.socket || !this.isConnected) {
      console.log('⚠️ WhatsApp no está conectado');
      return [];
    }

    try {
      // Obtener todos los chats
      const chats = await this.socket.groupFetchAllParticipating();
      
      console.log(`📋 Total de grupos encontrados: ${Object.keys(chats).length}`);
      
      const groups = Object.values(chats).map((chat: any) => {
        console.log(`Grupo: ${chat.subject}, ID: ${chat.id}, Participantes: ${chat.participants?.length}`);
        return {
          id: chat.id,
          name: chat.subject || 'Sin nombre',
          participants: chat.participants?.length || 0
        };
      });

      console.log(`📋 Grupos devueltos: ${groups.length}`);
      return groups;
    } catch (error) {
      console.error('❌ Error obteniendo grupos:', error);
      return [];
    }
  }
}

export const whatsappService = new WhatsAppService();
