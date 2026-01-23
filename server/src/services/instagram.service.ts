import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

interface InstagramConfig {
  pageId: string;
  pageAccessToken: string;
  appId: string;
  appSecret: string;
}

interface InstagramMessage {
  id: string;
  from: {
    id: string;
    username: string;
  };
  message: string;
  timestamp: string;
}

class InstagramService {
  private config: InstagramConfig | null = null;
  private isConnected: boolean = false;
  private configPath = path.join(process.cwd(), 'instagram-config.json');
  private webhookVerifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'mi_token_secreto_123';

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(data);
        this.isConnected = true;
        console.log('✅ Configuración de Instagram cargada');
      }
    } catch (error) {
      console.log('⚠️ No se pudo cargar configuración de Instagram');
    }
  }

  private saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      console.log('✅ Configuración de Instagram guardada');
    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
    }
  }

  async connect(config: InstagramConfig): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Intentando conectar Instagram con ID:', config.pageId);
      
      // Validar el token con la API de Instagram Graph
      // El pageId aquí es el Instagram Business Account ID
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${config.pageId}`,
        {
          params: {
            fields: 'id,username,name,profile_picture_url',
            access_token: config.pageAccessToken,
          },
        }
      );

      console.log('✅ Respuesta de Instagram:', response.data);

      if (response.data.id) {
        this.config = config;
        this.isConnected = true;
        this.saveConfig();

        // Suscribirse a webhooks (usando el Page ID de Facebook, no el Instagram ID)
        // await this.subscribeToWebhooks();

        const username = response.data.username || response.data.name || config.pageId;
        return {
          success: true,
          message: `Conectado a @${username}`,
        };
      }

      return {
        success: false,
        message: 'No se pudo validar la cuenta',
      };
    } catch (error: any) {
      console.error('❌ Error conectando Instagram:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.error?.message || 'Error al conectar';
      return {
        success: false,
        message: errorMsg,
      };
    }
  }

  async disconnect(): Promise<void> {
    this.config = null;
    this.isConnected = false;
    if (fs.existsSync(this.configPath)) {
      fs.unlinkSync(this.configPath);
    }
  }

  getStatus(): { connected: boolean; username?: string } {
    return {
      connected: this.isConnected,
      username: this.config?.pageId,
    };
  }

  async sendMessage(recipientId: string, message: string): Promise<boolean> {
    if (!this.config || !this.isConnected) {
      console.error('Instagram no está conectado');
      return false;
    }

    try {
      // Para Instagram, usamos el endpoint del Instagram Business Account
      await axios.post(
        `https://graph.facebook.com/v18.0/${this.config.pageId}/messages`,
        {
          recipient: { id: recipientId },
          message: { text: message },
        },
        {
          params: {
            access_token: this.config.pageAccessToken,
          },
        }
      );

      console.log(`✅ Mensaje enviado a ${recipientId} por Instagram`);
      return true;
    } catch (error: any) {
      console.error('Error enviando mensaje por Instagram:', error.response?.data || error.message);
      return false;
    }
  }

  async getUserInfo(userId: string): Promise<{ username: string; name: string } | null> {
    if (!this.config || !this.isConnected) return null;

    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${userId}`,
        {
          params: {
            fields: 'username,name',
            access_token: this.config.pageAccessToken,
          },
        }
      );

      return {
        username: response.data.username || userId,
        name: response.data.name || response.data.username || userId,
      };
    } catch (error) {
      console.error('Error obteniendo info de usuario:', error);
      return null;
    }
  }

  private async subscribeToWebhooks(): Promise<void> {
    if (!this.config) return;

    try {
      await axios.post(
        `https://graph.facebook.com/v18.0/${this.config.pageId}/subscribed_apps`,
        {},
        {
          params: {
            subscribed_fields: 'messages,messaging_postbacks',
            access_token: this.config.pageAccessToken,
          },
        }
      );
      console.log('✅ Suscrito a webhooks de Instagram');
    } catch (error: any) {
      console.error('Error suscribiendo a webhooks:', error.response?.data || error.message);
    }
  }

  // Webhook verification
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.webhookVerifyToken) {
      console.log('✅ Webhook verificado');
      return challenge;
    }
    return null;
  }

  // Process incoming webhook
  async processWebhook(body: any): Promise<void> {
    console.log('📨 Webhook recibido:', JSON.stringify(body, null, 2));
    
    // Instagram puede enviar como 'instagram' o 'page'
    if (body.object !== 'instagram' && body.object !== 'page') {
      console.log('⚠️ Objeto no es instagram/page:', body.object);
      return;
    }

    for (const entry of body.entry || []) {
      // Los mensajes pueden venir en 'messaging' o 'changes'
      const messages = entry.messaging || [];
      const changes = entry.changes || [];
      
      for (const messaging of messages) {
        if (messaging.message) {
          await this.handleIncomingMessage(messaging);
        }
      }
      
      // Procesar cambios (otra forma en que Instagram envía mensajes)
      for (const change of changes) {
        if (change.field === 'messages' && change.value) {
          const value = change.value;
          if (value.messages) {
            for (const msg of value.messages) {
              await this.handleIncomingMessage({
                sender: { id: value.sender?.id || msg.from },
                message: { text: msg.text?.body || msg.text }
              });
            }
          }
        }
      }
    }
  }

  private async handleIncomingMessage(messaging: any): Promise<void> {
    const senderId = messaging.sender.id;
    const messageText = messaging.message.text;

    if (!messageText) return;

    console.log(`📩 Mensaje de Instagram de ${senderId}: ${messageText}`);

    try {
      // Obtener info del usuario
      const userInfo = await this.getUserInfo(senderId);
      const username = userInfo?.username || senderId;

      // Registrar mensaje en la base de datos via API interna
      const { prisma } = await import('../lib/prisma');
      
      // Buscar o crear cliente
      let client = await prisma.client.findFirst({
        where: { instagramId: senderId }
      });

      if (!client) {
        const tenant = await prisma.tenant.findFirst();
        if (tenant) {
          client = await prisma.client.create({
            data: {
              name: username,
              instagramId: senderId,
              tenantId: tenant.id
            }
          });
        }
      }

      // Guardar mensaje en ChatMessage
      await prisma.chatMessage.create({
        data: {
          customerPhone: senderId,
          message: messageText,
          response: '',
          intent: 'OTRO',
          status: 'pending',
          platform: 'instagram',
          clientId: client?.id || null
        }
      });

      console.log(`✅ Mensaje de Instagram guardado en CRM: ${username}`);

      // NOTA: Respuesta automática desactivada hasta que Meta apruebe el permiso instagram_manage_messages
      // Por ahora solo guardamos los mensajes en el CRM para verlos manualmente
      
      /*
      // Verificar si el bot está activo
      const botConfig = await prisma.botConfig.findFirst();
      if (botConfig) {
        const config = JSON.parse(botConfig.config);
        if (config.isActive) {
          // Respuesta automática simple por ahora
          const autoResponse = `¡Hola! Gracias por escribirnos. Un asesor te responderá pronto. 📱`;
          await this.sendMessage(senderId, autoResponse);
          
          // Actualizar el mensaje con la respuesta
          await prisma.chatMessage.updateMany({
            where: { 
              customerPhone: senderId,
              platform: 'instagram',
              status: 'pending'
            },
            data: { 
              response: autoResponse,
              status: 'responded'
            }
          });
        }
      }
      */
    } catch (error) {
      console.error('❌ Error procesando mensaje de Instagram:', error);
    }
  }

  getWebhookVerifyToken(): string {
    return this.webhookVerifyToken;
  }
}

export const instagramService = new InstagramService();
