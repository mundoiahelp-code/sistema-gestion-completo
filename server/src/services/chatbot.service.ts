// Dummy Chatbot service for production (bot runs separately in chat-auto)
class ChatbotService {
  async sendNotification(phone: string, message: string) {
    console.log(`📱 Chatbot notification queued for ${phone}`);
    return true;
  }

  addSystemMessage(phone: string, message: string) {
    console.log(`📱 System message queued for ${phone}`);
    return true;
  }
}

export const chatbotService = new ChatbotService();
export default ChatbotService;
