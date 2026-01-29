import express from 'express';
import WhatsAppClient from './whatsapp/client.js';
import AnthropicClient from './ai/anthropic.js';
import SheetsClient from './sheets/client.js';
import StockManager from './sheets/stock.js';
import SalesManager from './sheets/sales.js';
import AppointmentsManager from './sheets/appointments.js';
import CustomersManager from './sheets/customers.js';
import ConversationManager from './services/conversationManager.js';
import SalesFlow from './services/salesFlow.js';
import FollowupService from './services/followupService.js';
import MessageHandler from './whatsapp/messageHandler.js';
import BackendIntegration from './services/backendIntegration.js';
import MercadoPagoService from './services/mercadoPago.js';
import { config } from './config/config.js';

// Adapters para backend
import AppointmentsAdapter from './adapters/appointments-adapter.js';
import StockAdapter from './adapters/stock-adapter.js';
import SalesAdapter from './adapters/sales-adapter.js';

class LumiBot {
  constructor() {
    this.whatsapp = null;
    this.ai = null;
    this.sheets = null;
    this.messageHandler = null;
    this.useBackend = process.env.USE_BACKEND === 'true';
    
    // MULTI-TENANT: Leer configuración del tenant
    this.tenantId = process.env.TENANT_ID;
    this.tenantName = process.env.TENANT_NAME || 'Cliente';
    this.botPort = process.env.BOT_API_PORT || 3001;
    
    if (!this.tenantId) {
      console.error('❌ ERROR: TENANT_ID no está configurado en .env');
      console.error('   El bot necesita saber a qué cliente pertenece.');
      process.exit(1);
    }
    
    console.log(`🏢 Bot iniciando para: ${this.tenantName} (${this.tenantId})`);
  }

  async initialize() {
    try {
      console.log('🤖 Iniciando Lumi Bot...\n');

      let stockManager, salesManager, appointmentsManager, customersManager;

      if (this.useBackend) {
        // Modo Backend API
        console.log('🔌 Usando Backend API (localhost:8000)...');
        
        // Inicializar adapters (no necesitan Google Sheets)
        stockManager = new StockAdapter(null);
        salesManager = new SalesAdapter(null);
        appointmentsManager = new AppointmentsAdapter(null);
        
        // CustomersManager se maneja automáticamente en el backend
        customersManager = {
          findOrCreate: async (data) => ({ id: 'backend-managed', ...data }),
          update: async () => true,
        };

      } else {
        // Modo Google Sheets (legacy)
        console.log('📊 Conectando con Google Sheets...');
        this.sheets = new SheetsClient();
        await this.sheets.initialize();

        // Inicializar managers tradicionales
        stockManager = new StockManager(this.sheets);
        salesManager = new SalesManager(this.sheets);
        appointmentsManager = new AppointmentsManager(this.sheets);
        customersManager = new CustomersManager(this.sheets);
      }

      // 3. Inicializar servicios
      const conversationManager = new ConversationManager();
      const salesFlow = new SalesFlow(
        stockManager,
        salesManager,
        appointmentsManager,
        customersManager
      );

      // 4. Inicializar IA
      console.log('🧠 Conectando con Anthropic...');
      this.ai = new AnthropicClient();

      // 5. Inicializar WhatsApp
      console.log('📱 Conectando con WhatsApp...');
      this.whatsapp = new WhatsAppClient();
      await this.whatsapp.initialize();

      // 6. Configurar el handler de mensajes en el cliente de WhatsApp
      this.whatsapp.setMessageHandler(async (phoneNumber, messageText, whatsappClient) => {
        await this.messageHandler.handleMessage(phoneNumber, messageText, whatsappClient);
      });

      // 6. Inicializar servicio de seguimiento (solo si usa sheets)
      let followupService = null;
      if (!this.useBackend && this.sheets) {
        followupService = new FollowupService(this.sheets, this.whatsapp);
        if (config.followup.enabled) {
          followupService.startAutoFollowup();
        }
      }

      // 7. Inicializar integración con backend
      const backendIntegration = this.useBackend ? new BackendIntegration() : null;

      // 8. Inicializar MercadoPago
      const mercadoPago = new MercadoPagoService();
      if (mercadoPago.isConfigured()) {
        console.log('💳 MercadoPago configurado correctamente');
      } else {
        console.log('⚠️ MercadoPago no configurado (sin access token)');
      }

      // 9. Inicializar message handler
      this.messageHandler = new MessageHandler(
        this.ai,
        conversationManager,
        salesFlow,
        customersManager,
        stockManager,
        followupService,
        backendIntegration,
        mercadoPago
      );

      console.log('\n✅ Lumi Bot iniciado correctamente!');
      console.log(`📊 Modo: ${this.useBackend ? 'Backend API' : 'Google Sheets'}`);
      console.log('📱 Esperando mensajes...\n');

      // Iniciar servidor HTTP para recibir peticiones de envío de mensajes
      this.startHttpServer();

    } catch (error) {
      console.error('❌ Error al inicializar el bot:', error);
      process.exit(1);
    }
  }

  startHttpServer() {
    const app = express();

    app.use(express.json());

    // Endpoint para enviar mensajes desde el server principal
    app.post('/api/send-message', async (req, res) => {
      try {
        const { phone, message } = req.body;
        
        if (!phone || !message) {
          return res.status(400).json({ error: 'phone y message son requeridos' });
        }

        console.log(`📤 [${this.tenantName}] Enviando mensaje a ${phone}...`);
        const sent = await this.whatsapp.sendMessage(phone, message);
        
        if (sent) {
          console.log(`✅ [${this.tenantName}] Mensaje enviado a ${phone}`);
          res.json({ success: true, message: 'Mensaje enviado' });
        } else {
          console.error(`❌ [${this.tenantName}] Error enviando mensaje a ${phone}`);
          res.status(500).json({ success: false, error: 'Error enviando mensaje' });
        }
      } catch (error) {
        console.error(`❌ [${this.tenantName}] Error en /api/send-message:`, error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Endpoint para enviar mensajes a grupos o listas de difusión
    app.post('/api/send-group-message', async (req, res) => {
      try {
        const { chatId, message } = req.body;
        
        if (!chatId || !message) {
          return res.status(400).json({ error: 'chatId y message son requeridos' });
        }

        console.log(`📤 [${this.tenantName}] Enviando mensaje a grupo ${chatId}...`);
        const sent = await this.whatsapp.sendGroupMessage(chatId, message);
        
        if (sent) {
          console.log(`✅ [${this.tenantName}] Mensaje enviado a grupo ${chatId}`);
          res.json({ success: true, message: 'Mensaje enviado al grupo' });
        } else {
          console.error(`❌ [${this.tenantName}] Error enviando mensaje a grupo ${chatId}`);
          res.status(500).json({ success: false, error: 'Error enviando mensaje al grupo' });
        }
      } catch (error) {
        console.error(`❌ [${this.tenantName}] Error en /api/send-group-message:`, error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Health check con info del tenant
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        whatsapp: !!this.whatsapp,
        tenantId: this.tenantId,
        tenantName: this.tenantName,
        connected: this.whatsapp?.sock?.user ? true : false
      });
    });

    // Endpoint para obtener QR code
    app.get('/api/qr', (req, res) => {
      const qr = this.whatsapp?.currentQR;
      if (qr) {
        res.json({ qrCode: qr, connected: false });
      } else if (this.whatsapp?.sock?.user) {
        res.json({ connected: true, phone: this.whatsapp.sock.user.id });
      } else {
        res.json({ connected: false, qrCode: null });
      }
    });

    // Endpoint para cerrar sesión de WhatsApp
    app.post('/api/logout', async (req, res) => {
      try {
        console.log(`🚪 [${this.tenantName}] Cerrando sesión de WhatsApp...`);
        
        if (this.whatsapp?.sock) {
          try {
            // Intentar cerrar la conexión de WhatsApp
            await this.whatsapp.sock.logout();
            console.log(`✅ [${this.tenantName}] Logout ejecutado`);
          } catch (error) {
            console.log(`⚠️  [${this.tenantName}] Error en logout (continuando con limpieza):`, error.message);
          }
        }
        
        // IMPORTANTE: Eliminar la sesión guardada para evitar reconexión automática
        try {
          await this.whatsapp.deleteSession();
          console.log(`🗑️  [${this.tenantName}] Sesión eliminada del disco`);
        } catch (error) {
          console.error(`❌ [${this.tenantName}] Error eliminando sesión:`, error);
        }
        
        // Limpiar el socket
        this.whatsapp.sock = null;
        this.whatsapp.currentQR = null;
        
        res.json({ 
          success: true, 
          message: 'Sesión de WhatsApp cerrada y eliminada correctamente' 
        });
      } catch (error) {
        console.error(`❌ [${this.tenantName}] Error cerrando sesión:`, error);
        res.status(500).json({ 
          success: false, 
          error: 'Error cerrando sesión de WhatsApp' 
        });
      }
    });

    app.listen(this.botPort, () => {
      console.log(`🌐 [${this.tenantName}] API del bot escuchando en puerto ${this.botPort}`);
    });
}

// Iniciar el bot
const bot = new LumiBot();
bot.initialize().catch(console.error);

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
  console.error('Error no manejado:', error);
});

process.on('SIGINT', () => {
  console.log('\n👋 Cerrando Lumi Bot...');
  process.exit(0);
});
