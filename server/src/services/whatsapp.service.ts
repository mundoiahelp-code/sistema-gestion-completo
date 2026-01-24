// Dummy WhatsApp service for production (bot runs separately)
class WhatsAppService {
  async initialize() {
    console.log('⚠️ WhatsApp service disabled in production mode');
    return false;
  }

  async sendMessage(phone: string, message: string, tenantId?: string) {
    console.log(`📱 WhatsApp message queued for ${phone}${tenantId ? ` (tenant: ${tenantId})` : ''}`);
    return true;
  }

  async sendMessageToGroup(chatId: string, message: string, tenantId?: string) {
    console.log(`📱 WhatsApp group message queued for ${chatId}${tenantId ? ` (tenant: ${tenantId})` : ''}`);
    return true;
  }

  getSocket() {
    return null;
  }

  getStatus() {
    return {
      connected: false,
      message: 'WhatsApp bot runs separately'
    };
  }

  async disconnect() {
    console.log('⚠️ WhatsApp disconnect called (dummy service)');
    return true;
  }

  async reconnect() {
    console.log('⚠️ WhatsApp reconnect called (dummy service)');
    return false;
  }
}

export const whatsappService = new WhatsAppService();
