// Dummy WhatsApp service for production (bot runs separately)
class WhatsAppService {
  async initialize() {
    console.log('⚠️ WhatsApp service disabled in production mode');
    return false;
  }

  async sendMessage(phone: string, message: string) {
    console.log(`📱 WhatsApp message queued for ${phone}`);
    return true;
  }

  async sendMessageToGroup(chatId: string, message: string) {
    console.log(`📱 WhatsApp group message queued for ${chatId}`);
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
}

export const whatsappService = new WhatsAppService();
