import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const botApi = axios.create({
  baseURL: `${API_URL}/bot`,
});

// Interceptor para agregar token automáticamente
botApi.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface BotConfig {
  isActive: boolean;
  botName: string;
  responseDelay: number;
  maxMessagesPerMinute: number;
  autoResponse: boolean;
  workingHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  personality: {
    tone: string;
    style: string;
    useEmojis: boolean;
  };
}

export interface ChatMessage {
  id: string;
  customerPhone: string;
  customerName: string;
  message: string;
  response: string;
  timestamp: Date;
  status: 'pending' | 'responded' | 'escalated';
  intent: string;
}

export interface BotStats {
  totalMessages: number;
  responseRate: number;
  avgResponseTime: number;
  activeChats: number;
  resolvedToday: number;
  escalatedToday: number;
}

export const botService = {
  // Configuración
  async getConfig(): Promise<BotConfig> {
    const response = await botApi.get('/config');
    return response.data.config;
  },

  async updateConfig(config: BotConfig): Promise<void> {
    await botApi.put('/config', config);
  },

  async toggleBot(isActive: boolean): Promise<void> {
    await botApi.post('/toggle', { isActive });
  },

  // Estadísticas
  async getStats(): Promise<BotStats> {
    const response = await botApi.get('/stats');
    return response.data.stats;
  },

  async getIntentAnalysis(): Promise<Array<{ intent: string; count: number; percentage: number }>> {
    const response = await botApi.get('/intent-analysis');
    return response.data.analysis;
  },

  // Mensajes
  async getChatMessages(limit = 20, offset = 0): Promise<ChatMessage[]> {
    const response = await botApi.get('/messages', {
      params: { limit, offset }
    });
    return response.data.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  },

  async logChatMessage(data: {
    customerPhone: string;
    message: string;
    response?: string;
    intent?: string;
    status?: string;
  }): Promise<void> {
    await botApi.post('/messages', data);
  }
};