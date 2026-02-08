import NodeCache from 'node-cache';
import { config } from '../config/config.js';

class ConversationManager {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: config.cache.ttl,
      checkperiod: config.cache.checkperiod
    });
  }

  getConversation(phoneNumber) {
    const conversation = this.cache.get(phoneNumber);
    return conversation || {
      messages: [],
      context: {},
      state: 'INITIAL',
      lastInteraction: Date.now()
    };
  }

  addMessage(phoneNumber, role, content) {
    const conversation = this.getConversation(phoneNumber);
    
    conversation.messages.push({
      role,
      content,
      timestamp: Date.now()
    });

    conversation.lastInteraction = Date.now();

    // Mantener solo los últimos 20 mensajes
    if (conversation.messages.length > 20) {
      conversation.messages = conversation.messages.slice(-20);
    }

    this.cache.set(phoneNumber, conversation);
  }

  updateContext(phoneNumber, contextData) {
    const conversation = this.getConversation(phoneNumber);
    conversation.context = { ...conversation.context, ...contextData };
    this.cache.set(phoneNumber, conversation);
  }

  setState(phoneNumber, state) {
    const conversation = this.getConversation(phoneNumber);
    conversation.state = state;
    this.cache.set(phoneNumber, conversation);
  }

  getState(phoneNumber) {
    const conversation = this.getConversation(phoneNumber);
    return conversation.state;
  }

  clearConversation(phoneNumber) {
    this.cache.del(phoneNumber);
  }

  getActiveConversations() {
    const keys = this.cache.keys();
    return keys.map(key => ({
      phoneNumber: key,
      ...this.cache.get(key)
    }));
  }
}

export default ConversationManager;
