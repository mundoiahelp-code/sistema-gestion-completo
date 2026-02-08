/**
 * WhatsApp Multi-Tenant Manager
 * Maneja múltiples instancias de WhatsApp, una por cada tenant
 */

import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  Browsers
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import path from 'path';
import fs from 'fs';

class WhatsAppMultiTenantManager {
  constructor() {
    this.instances = new Map(); // tenantId -> WhatsApp instance
    this.authBasePath = 'auth_sessions'; // Carpeta base para sesiones
    
    // Crear carpeta si no existe
    if (!fs.existsSync(this.authBasePath)) {
      fs.mkdirSync(this.authBasePath, { recursive: true });
    }
  }

  /**
   * Obtener o crear instancia de WhatsApp para un tenant
   */
  async getInstance(tenantId, tenantName = 'Cliente') {
    // Si ya existe, retornarla
    if (this.instances.has(tenantId)) {
      return this.instances.get(tenantId);
    }

    // Crear nueva instancia
    console.log(`📱 Creando instancia de WhatsApp para tenant: ${tenantId}`);
    const instance = await this.createInstance(tenantId, tenantName);
    this.instances.set(tenantId, instance);
    
    return instance;
  }

  /**
   * Crear una nueva instancia de WhatsApp
   */
  async createInstance(tenantId, tenantName) {
    const authPath = path.join(this.authBasePath, tenantId);
    
    // Crear carpeta de autenticación para este tenant
    if (!fs.existsSync(authPath)) {
      fs.mkdirSync(authPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      browser: [tenantName, 'Chrome', '10.0'], // Nombre personalizado por tenant
      syncFullHistory: false,
      markOnlineOnConnect: false,
      getMessage: async () => undefined,
    });

    // Manejar eventos de conexión
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`\n📱 QR Code para ${tenantName} (${tenantId}):`);
        // Aquí podrías guardar el QR en la base de datos para mostrarlo en el frontend
        sock.qrCode = qr;
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error instanceof Boom 
          ? lastDisconnect.error.output.statusCode 
          : null;
        
        console.log(`❌ Conexión cerrada para ${tenantName}: ${statusCode}`);
        
        // Si fue logout, eliminar instancia
        if (statusCode === DisconnectReason.loggedOut) {
          this.instances.delete(tenantId);
          console.log(`🗑️ Instancia eliminada para ${tenantName}`);
        } else {
          // Intentar reconectar
          console.log(`🔄 Reconectando ${tenantName}...`);
          setTimeout(() => this.createInstance(tenantId, tenantName), 5000);
        }
      }

      if (connection === 'open') {
        console.log(`✅ WhatsApp conectado para ${tenantName}`);
        sock.connected = true;
      }
    });

    // Guardar credenciales cuando cambien
    sock.ev.on('creds.update', saveCreds);

    return {
      sock,
      tenantId,
      tenantName,
      connected: false,
      qrCode: null,
    };
  }

  /**
   * Enviar mensaje a través de la instancia del tenant
   */
  async sendMessage(tenantId, phone, message) {
    const instance = this.instances.get(tenantId);
    
    if (!instance || !instance.connected) {
      throw new Error(`WhatsApp no conectado para tenant ${tenantId}`);
    }

    const formattedPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
    
    await instance.sock.sendMessage(formattedPhone, { text: message });
    console.log(`📤 Mensaje enviado a ${phone} desde tenant ${tenantId}`);
  }

  /**
   * Obtener QR code para un tenant
   */
  getQRCode(tenantId) {
    const instance = this.instances.get(tenantId);
    return instance?.qrCode || null;
  }

  /**
   * Verificar si un tenant está conectado
   */
  isConnected(tenantId) {
    const instance = this.instances.get(tenantId);
    return instance?.connected || false;
  }

  /**
   * Desconectar un tenant
   */
  async disconnect(tenantId) {
    const instance = this.instances.get(tenantId);
    
    if (instance) {
      await instance.sock.logout();
      this.instances.delete(tenantId);
      console.log(`🔌 Tenant ${tenantId} desconectado`);
    }
  }

  /**
   * Obtener todas las instancias activas
   */
  getActiveInstances() {
    return Array.from(this.instances.entries()).map(([tenantId, instance]) => ({
      tenantId,
      tenantName: instance.tenantName,
      connected: instance.connected,
    }));
  }
}

export default WhatsAppMultiTenantManager;
