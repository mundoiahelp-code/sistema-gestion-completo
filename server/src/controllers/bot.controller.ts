import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

interface BotConfig {
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

// Configuración por defecto del bot
const DEFAULT_BOT_CONFIG: BotConfig = {
  isActive: true,
  botName: 'Lumi',
  responseDelay: 2,
  maxMessagesPerMinute: 10,
  autoResponse: true,
  workingHours: {
    enabled: true,
    start: '09:00',
    end: '19:00'
  },
  personality: {
    tone: 'friendly',
    style: 'argentinian',
    useEmojis: true
  }
};

export class BotController {
  // Obtener configuración del bot
  static async getConfig(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      
      // Buscar configuración del tenant
      let config = await prisma.botConfig.findFirst({
        where: { tenantId }
      });
      
      if (!config) {
        // Si no existe, crear configuración por defecto para este tenant
        config = await prisma.botConfig.create({
          data: {
            config: JSON.stringify(DEFAULT_BOT_CONFIG),
            tenantId
          }
        });
      }

      res.json({
        success: true,
        config: JSON.parse(config.config)
      });
    } catch (error) {
      console.error('Error obteniendo configuración del bot:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar configuración del bot
  static async updateConfig(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const newConfig: BotConfig = req.body;

      // Validar configuración
      if (!newConfig.botName || newConfig.botName.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El nombre del bot es requerido'
        });
      }

      if (newConfig.responseDelay < 0 || newConfig.responseDelay > 30) {
        return res.status(400).json({
          success: false,
          message: 'El delay debe estar entre 0 y 30 segundos'
        });
      }

      // Buscar configuración existente del tenant
      let config = await prisma.botConfig.findFirst({
        where: { tenantId }
      });
      
      if (config) {
        config = await prisma.botConfig.update({
          where: { id: config.id },
          data: { config: JSON.stringify(newConfig) }
        });
      } else {
        config = await prisma.botConfig.create({
          data: { 
            config: JSON.stringify(newConfig),
            tenantId
          }
        });
      }

      res.json({
        success: true,
        message: 'Configuración actualizada correctamente',
        config: JSON.parse(config.config)
      });
    } catch (error) {
      console.error('Error actualizando configuración del bot:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener estadísticas del bot
  static async getStats(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const baseWhere = { tenantId };
      const todayWhere = { ...baseWhere, createdAt: { gte: today, lt: tomorrow } };

      // Contar mensajes del día
      const totalMessages = await prisma.chatMessage.count({
        where: todayWhere
      });

      // Contar mensajes respondidos
      const respondedMessages = await prisma.chatMessage.count({
        where: { ...todayWhere, status: 'responded' }
      });

      // Contar mensajes escalados
      const escalatedMessages = await prisma.chatMessage.count({
        where: { ...todayWhere, status: 'escalated' }
      });

      // Calcular tasa de respuesta
      const responseRate = totalMessages > 0 ? (respondedMessages / totalMessages) * 100 : 0;

      // Contar chats activos (últimas 2 horas)
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      const activeChats = await prisma.chatMessage.groupBy({
        by: ['customerPhone'],
        where: { ...baseWhere, createdAt: { gte: twoHoursAgo } }
      });

      res.json({
        success: true,
        stats: {
          totalMessages,
          responseRate: Math.round(responseRate * 100) / 100,
          avgResponseTime: 3.5,
          activeChats: activeChats.length,
          resolvedToday: respondedMessages,
          escalatedToday: escalatedMessages
        }
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas del bot:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener mensajes de chat recientes
  static async getChatMessages(req: AuthRequest, res: Response) {
    try {
      const { limit = 20, offset = 0, platform } = req.query;
      const tenantId = req.user?.tenantId;

      const where: any = { tenantId }; // FILTRAR POR TENANT
      if (platform && platform !== 'all') {
        where.platform = platform;
      }

      const messages = await prisma.chatMessage.findMany({
        where,
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          client: {
            select: {
              name: true,
              phone: true
            }
          }
        }
      });

      console.log('📨 Mensajes encontrados:', messages.length);
      console.log('📨 Primer mensaje sentBy:', messages[0]?.sentBy);

      res.json({
        success: true,
        messages: messages.map(msg => ({
          id: msg.id,
          customerPhone: msg.customerPhone,
          customerName: msg.client?.name || 'Cliente',
          originalJid: msg.originalJid || msg.customerPhone,
          message: msg.message,
          response: msg.response || '',
          timestamp: msg.createdAt,
          status: msg.status,
          intent: msg.intent || 'OTRO',
          category: msg.category || undefined,
          notes: msg.notes || undefined,
          resolved: msg.resolved || false,
          platform: msg.platform || 'whatsapp',
          sentBy: msg.sentBy || undefined, // Solo mostrar si existe, no inventar
        }))
      });
    } catch (error) {
      console.error('Error obteniendo mensajes de chat:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Normalizar número de teléfono (helper privado)
  private static normalizePhoneNumber(phone: string): string {
    // Remover todos los sufijos de WhatsApp
    let normalized = phone.replace(/@s\.whatsapp\.net|@lid|@g\.us|@c\.us/g, '');
    
    // Remover espacios, guiones y otros caracteres
    normalized = normalized.replace(/[\s\-\(\)]/g, '');
    
    // Si empieza con +, removerlo
    normalized = normalized.replace(/^\+/, '');
    
    // Asegurar que solo contenga números
    normalized = normalized.replace(/\D/g, '');
    
    return normalized;
  }

  // Registrar nuevo mensaje de chat
  static async logChatMessage(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { customerPhone, customerName, originalJid, message, response, intent, status = 'responded', platform = 'whatsapp', sentBy } = req.body;

      if (!customerPhone || !message) {
        console.error('❌ Faltan datos: customerPhone o message');
        return res.status(400).json({
          success: false,
          message: 'Teléfono del cliente y mensaje son requeridos'
        });
      }

      // Normalizar el número de teléfono
      const normalizedPhone = BotController.normalizePhoneNumber(customerPhone);

      // Buscar cliente por teléfono normalizado DENTRO DEL TENANT
      let client = await prisma.client.findFirst({
        where: { phone: normalizedPhone, tenantId }
      });

      // Si no existe, crear cliente en el tenant actual
      if (!client && tenantId) {
        const clientName = customerName || `Cliente ${normalizedPhone.slice(-4)}`;
        client = await prisma.client.create({
          data: {
            phone: normalizedPhone,
            name: clientName,
            tenantId
          }
        });
      } else if (client && customerName && !client.name.startsWith('Cliente')) {
        // Actualizar nombre si viene uno nuevo y el actual es genérico
        await prisma.client.update({
          where: { id: client.id },
          data: { name: customerName }
        });
      }

      // Registrar mensaje con número normalizado Y tenantId
      const chatMessage = await prisma.chatMessage.create({
        data: {
          customerPhone: normalizedPhone,
          originalJid: originalJid || normalizedPhone, // Guardar JID original para responder
          message,
          response: response || '',
          intent: intent || 'OTRO',
          status,
          platform: platform || 'whatsapp',
          ...(client?.id && { client: { connect: { id: client.id } } }),
          ...(tenantId && { tenant: { connect: { id: tenantId } } }),
          sentBy: sentBy || null,
        }
      });

      console.log(`✅ Mensaje guardado: ${normalizedPhone} (${intent}) - sentBy: ${sentBy || 'null'}`);

      res.json({
        success: true,
        message: 'Mensaje registrado correctamente',
        chatMessage
      });
    } catch (error) {
      console.error('❌ Error registrando mensaje:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Cambiar estado del bot (activar/pausar)
  static async toggleBot(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { isActive } = req.body;

      let config = await prisma.botConfig.findFirst({
        where: { tenantId }
      });
      
      if (!config) {
        config = await prisma.botConfig.create({
          data: {
            config: JSON.stringify({ ...DEFAULT_BOT_CONFIG, isActive }),
            tenantId
          }
        });
      } else {
        const currentConfig = JSON.parse(config.config) as BotConfig;
        config = await prisma.botConfig.update({
          where: { id: config.id },
          data: {
            config: JSON.stringify({ ...currentConfig, isActive })
          }
        });
      }

      res.json({
        success: true,
        message: `Bot ${isActive ? 'activado' : 'pausado'} correctamente`,
        isActive
      });
    } catch (error) {
      console.error('Error cambiando estado del bot:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener análisis de intenciones
  static async getIntentAnalysis(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const intentCounts = await prisma.chatMessage.groupBy({
        by: ['intent'],
        where: {
          tenantId,
          createdAt: { gte: today, lt: tomorrow }
        },
        _count: { intent: true }
      });

      const totalMessages = intentCounts.reduce((sum, item) => sum + item._count.intent, 0);

      const analysis = intentCounts.map(item => ({
        intent: item.intent,
        count: item._count.intent,
        percentage: totalMessages > 0 ? Math.round((item._count.intent / totalMessages) * 100) : 0
      }));

      res.json({
        success: true,
        analysis
      });
    } catch (error) {
      console.error('Error obteniendo análisis de intenciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar categoría de un chat
  static async updateCategory(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { phone, category } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Teléfono es requerido'
        });
      }

      // Actualizar solo mensajes del tenant actual
      await prisma.chatMessage.updateMany({
        where: { customerPhone: phone, tenantId },
        data: { category: category || null }
      });

      res.json({
        success: true,
        message: category ? 'Categoría actualizada correctamente' : 'Categoría eliminada correctamente'
      });
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar notas de un chat
  static async updateNotes(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { phone, notes } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Teléfono es requerido'
        });
      }

      // Actualizar solo mensajes del tenant actual
      await prisma.chatMessage.updateMany({
        where: { customerPhone: phone, tenantId },
        data: { notes: notes || null }
      });

      res.json({
        success: true,
        message: 'Notas actualizadas correctamente'
      });
    } catch (error) {
      console.error('Error actualizando notas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar estado resuelto de un chat
  static async updateResolved(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { phone, resolved } = req.body;

      if (!phone || typeof resolved !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Teléfono y estado resuelto son requeridos'
        });
      }

      // Actualizar solo mensajes del tenant actual
      await prisma.chatMessage.updateMany({
        where: { customerPhone: phone, tenantId },
        data: { resolved }
      });

      res.json({
        success: true,
        message: `Chat marcado como ${resolved ? 'resuelto' : 'pendiente'} correctamente`
      });
    } catch (error) {
      console.error('Error actualizando estado resuelto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar nombre del cliente
  static async updateClientName(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { phone, name } = req.body;

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Teléfono es requerido'
        });
      }

      // Buscar cliente DENTRO DEL TENANT
      let client = await prisma.client.findFirst({
        where: { phone, tenantId }
      });

      if (client) {
        const finalName = name && name.trim() ? name.trim() : `Cliente ${phone.slice(-4)}`;
        await prisma.client.update({
          where: { id: client.id },
          data: { name: finalName }
        });
      } else if (name && name.trim() && tenantId) {
        // Crear cliente en el tenant actual
        await prisma.client.create({
          data: {
            phone,
            name: name.trim(),
            tenantId
          }
        });
      }

      res.json({
        success: true,
        message: name ? 'Nombre del cliente actualizado correctamente' : 'Nombre del cliente eliminado correctamente'
      });
    } catch (error) {
      console.error('Error actualizando nombre del cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Eliminar chat (todos los mensajes de un teléfono)
  static async deleteChat(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { phone } = req.params;

      console.log('🗑️ Intentando eliminar chat:', phone);

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: 'Teléfono es requerido'
        });
      }

      // Eliminar solo mensajes del tenant actual
      const deleted = await prisma.chatMessage.deleteMany({
        where: { customerPhone: phone, tenantId }
      });

      console.log(`✅ Chat eliminado: ${phone} (${deleted.count} mensajes)`);

      res.json({
        success: true,
        message: `Chat eliminado correctamente (${deleted.count} mensajes)`,
        deletedCount: deleted.count
      });
    } catch (error) {
      console.error('❌ Error eliminando chat:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Recargar configuración del bot (notificar al bot que hay cambios)
  static async reloadConfig(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;

      // Obtener tenant con toda la configuración actualizada
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          stores: true
        }
      });

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      console.log(`🔄 Recargando configuración del bot para tenant: ${tenant.name}`);

      // Aquí podrías notificar al bot via webhook o evento
      // Por ahora solo confirmamos que la configuración está actualizada
      
      res.json({
        success: true,
        message: 'Configuración actualizada correctamente',
        tenant: {
          name: tenant.name,
          whatsapp: tenant.whatsapp,
          whatsappAsesor: tenant.whatsappAsesor,
          botPaymentMethods: tenant.botPaymentMethods,
          botWarrantyDays: tenant.botWarrantyDays,
          botShipsOrders: tenant.botShipsOrders,
          shippingZones: tenant.shippingZones,
          stores: tenant.stores.length
        }
      });
    } catch (error) {
      console.error('❌ Error recargando configuración:', error);
      res.status(500).json({ error: 'Error al recargar configuración' });
    }
  }

  // Generar respuesta del bot con IA
  static async generateResponse(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user?.tenantId;
      const { message } = req.body;

      if (!message || message.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Mensaje es requerido'
        });
      }

      console.log(`🤖 [${tenantId}] Generando respuesta para: "${message.substring(0, 50)}..."`);

      // Importar el servicio de Anthropic
      const { anthropicService } = await import('../services/anthropic.service');
      
      // Generar respuesta
      const response = await anthropicService.generateResponse(message);

      console.log(`✅ [${tenantId}] Respuesta generada: "${response.substring(0, 50)}..."`);

      res.json({
        success: true,
        response
      });
    } catch (error) {
      console.error('❌ Error generando respuesta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}
