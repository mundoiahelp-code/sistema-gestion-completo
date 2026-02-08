// Dummy WhatsApp auth store for production (bot runs separately)
export class WhatsAppAuthStore {
  constructor() {
    console.log('⚠️ WhatsApp auth store disabled in production mode');
  }
}

export default WhatsAppAuthStore;
