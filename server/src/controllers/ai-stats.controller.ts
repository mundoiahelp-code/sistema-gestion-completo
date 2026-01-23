import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Obtener estadísticas de IA de un tenant
export const getTenantAIStats = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Mensajes del bot hoy
    const messagesToday = await prisma.chatMessage.count({
      where: {
        tenantId,
        createdAt: { gte: startOfToday },
        sentBy: 'bot'
      }
    });

    // Mensajes del bot este mes
    const messagesMonth = await prisma.chatMessage.count({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth },
        sentBy: 'bot'
      }
    });

    // Total de conversaciones
    const totalConversations = await prisma.chatMessage.groupBy({
      by: ['customerPhone'],
      where: {
        tenantId,
        sentBy: 'bot'
      }
    });

    // Estimación de tokens (aproximadamente 4 caracteres por token)
    const messagesWithContent = await prisma.chatMessage.findMany({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth },
        sentBy: 'bot',
        response: { not: null }
      },
      select: {
        response: true
      }
    });

    const totalChars = messagesWithContent.reduce((sum, msg) => {
      return sum + (msg.response?.length || 0);
    }, 0);

    const estimatedTokens = Math.ceil(totalChars / 4);
    
    // Costo estimado (GPT-4o-mini: ~$0.15 por 1M tokens de salida)
    const costPerToken = 0.15 / 1000000;
    const estimatedCost = estimatedTokens * costPerToken;

    // Obtener configuración del bot
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        botEnabled: true,
        name: true
      }
    });

    res.json({
      messagesToday,
      messagesMonth,
      totalConversations: totalConversations.length,
      estimatedTokens,
      estimatedCost: estimatedCost.toFixed(2),
      botEnabled: tenant?.botEnabled || false,
      tenantName: tenant?.name || ''
    });
  } catch (error) {
    console.error('Error getting AI stats:', error);
    res.status(400).json({ error: 'Error al obtener estadísticas de IA' });
  }
};

// Pausar/Activar IA de un tenant
export const toggleTenantAI = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { enabled } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { botEnabled: enabled }
    });

    res.json({ 
      tenant, 
      message: enabled ? 'IA activada' : 'IA pausada' 
    });
  } catch (error) {
    console.error('Error toggling AI:', error);
    res.status(400).json({ error: 'Error al cambiar estado de IA' });
  }
};

// Obtener estadísticas globales de IA
export const getGlobalAIStats = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total de mensajes del bot este mes (todos los tenants)
    const totalMessagesMonth = await prisma.chatMessage.count({
      where: {
        createdAt: { gte: startOfMonth },
        sentBy: 'bot'
      }
    });

    // Mensajes por tenant
    const messagesByTenant = await prisma.chatMessage.groupBy({
      by: ['tenantId'],
      where: {
        createdAt: { gte: startOfMonth },
        sentBy: 'bot'
      },
      _count: {
        id: true
      }
    });

    // Tenants con consumo alto (más de 100 mensajes este mes)
    const highConsumptionTenants = messagesByTenant.filter(t => t._count.id > 100).length;

    // Estimación global de tokens
    const messagesWithContent = await prisma.chatMessage.findMany({
      where: {
        createdAt: { gte: startOfMonth },
        sentBy: 'bot',
        response: { not: null }
      },
      select: {
        response: true
      }
    });

    const totalChars = messagesWithContent.reduce((sum, msg) => {
      return sum + (msg.response?.length || 0);
    }, 0);

    const estimatedTokens = Math.ceil(totalChars / 4);
    const costPerToken = 0.15 / 1000000;
    const estimatedCost = estimatedTokens * costPerToken;

    res.json({
      totalMessagesMonth,
      estimatedTokens,
      estimatedCost: estimatedCost.toFixed(2),
      highConsumptionTenants
    });
  } catch (error) {
    console.error('Error getting global AI stats:', error);
    res.status(400).json({ error: 'Error al obtener estadísticas globales' });
  }
};

// Obtener facturación mensual total
export const getMonthlyRevenue = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total de pagos este mes
    const payments = await prisma.payment.findMany({
      where: {
        paidAt: { gte: startOfMonth }
      },
      select: {
        amount: true
      }
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

    res.json({
      totalRevenue,
      paymentsCount: payments.length
    });
  } catch (error) {
    console.error('Error getting monthly revenue:', error);
    res.status(400).json({ error: 'Error al obtener facturación' });
  }
};
