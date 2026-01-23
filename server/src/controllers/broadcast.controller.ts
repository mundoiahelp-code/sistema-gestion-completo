import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const channelSchema = z.object({
  name: z.string().min(1),
  chatId: z.string().min(1),
  type: z.enum(['GROUP', 'BROADCAST_LIST']).optional(),
  message: z.string().optional(),
  sendTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  sendStock: z.boolean().optional(),
  enabled: z.boolean().optional(),
  frequency: z.number().int().min(1).max(30).optional(), // De 1 a 30 días
});

// Obtener todos los canales
export const getChannels = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    
    const channels = await prisma.broadcastChannel.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ channels });
  } catch (error) {
    console.error('Error getting channels:', error);
    res.status(400).json({ error: 'Error al obtener canales' });
  }
};

// Crear canal
export const createChannel = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const data = channelSchema.parse(req.body);

    const channel = await prisma.broadcastChannel.create({
      data: {
        ...data,
        tenantId,
      },
    });

    res.status(201).json({ channel });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(400).json({ error: 'Error al crear canal' });
  }
};

// Actualizar canal
export const updateChannel = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const data = channelSchema.partial().parse(req.body);

    // Verificar que el canal pertenece al tenant
    const existing = await prisma.broadcastChannel.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }

    const channel = await prisma.broadcastChannel.update({
      where: { id },
      data,
    });

    res.json({ channel });
  } catch (error) {
    console.error('Error updating channel:', error);
    res.status(400).json({ error: 'Error al actualizar canal' });
  }
};

// Eliminar canal
export const deleteChannel = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    // Verificar que el canal pertenece al tenant
    const existing = await prisma.broadcastChannel.findFirst({
      where: { id, tenantId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }

    await prisma.broadcastChannel.delete({
      where: { id },
    });

    res.json({ message: 'Canal eliminado' });
  } catch (error) {
    console.error('Error deleting channel:', error);
    res.status(400).json({ error: 'Error al eliminar canal' });
  }
};

// Enviar mensaje manual a un canal
export const sendToChannel = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const { message } = req.body;

    // Verificar que el canal pertenece al tenant
    const channel = await prisma.broadcastChannel.findFirst({
      where: { id, tenantId },
    });

    if (!channel) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }

    // Obtener stock si es necesario
    let finalMessage = message || channel.message || '';
    
    if (finalMessage.includes('{stock}') || channel.sendStock) {
      const stockText = await generateStockMessage(channel.tenantId);
      finalMessage = finalMessage.replace('{stock}', stockText) || stockText;
    }

    // Enviar via WhatsApp (se conecta al servicio de chat-auto multi-tenant)
    const sent = await require('../services/whatsapp.service').whatsappService.sendMessageToGroup(
      channel.chatId, 
      finalMessage,
      tenantId
    );
    
    if (!sent) {
      return res.status(500).json({ error: 'Error al enviar mensaje por WhatsApp' });
    }

    // Actualizar lastSent
    await prisma.broadcastChannel.update({
      where: { id },
      data: { lastSent: new Date() },
    });

    res.json({ 
      success: true, 
      message: 'Mensaje enviado',
      sentMessage: finalMessage,
      chatId: channel.chatId 
    });
  } catch (error) {
    console.error('Error sending to channel:', error);
    res.status(400).json({ error: 'Error al enviar mensaje' });
  }
};

// Generar mensaje de stock (formato igual a "Copiar Stock")
async function generateStockMessage(tenantId: string): Promise<string> {
  const products = await prisma.product.findMany({
    where: {
      tenantId,
      active: true,
      stock: { gt: 0 },
      reserved: { equals: 0 }, // Solo no reservados
      category: 'PHONE',
    },
    orderBy: [{ model: 'asc' }, { storage: 'asc' }],
  });

  if (products.length === 0) {
    return '💣 *STOCK DISPONIBLE ENTREGA INMEDIATA* 💣\n*RESERVAR ES COMPROMISO DE COMPRA*\n\nSin stock disponible por el momento';
  }

  // Agrupar por modelo + storage
  const groupMap = new Map<string, any[]>();
  
  products.forEach(p => {
    const key = `${p.model}|${p.storage}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push(p);
  });

  let msg = '⚡️ *STOCK DISPONIBLE ENTREGA INMEDIATA* ⚡️\n';
  msg += '*ENVIOS A TODO EL PAIS*\n\n';

  // Ordenar grupos por modelo
  const sortedGroups = Array.from(groupMap.entries()).sort((a, b) => {
    const modelA = a[1][0].model;
    const modelB = b[1][0].model;
    return modelA.localeCompare(modelB);
  });

  sortedGroups.forEach(([_, phones]) => {
    const first = phones[0];
    const batteries = phones.map(p => p.battery).filter(b => b != null).sort((a, b) => a - b);
    const prices = phones.map(p => p.price).filter(p => p != null).sort((a, b) => a - b);
    const colors = [...new Set(phones.map(p => p.color?.toLowerCase()).filter(Boolean))];

    let line = `· ${first.model} ${first.storage}`;

    // Batería
    if (batteries.length > 0) {
      if (batteries[0] === batteries[batteries.length - 1]) {
        line += ` ${batteries[0]}%`;
      } else {
        line += ` ${batteries[0]}% a ${batteries[batteries.length - 1]}%`;
      }
    }

    // Colores
    if (colors.length > 0) {
      line += ` (${colors.join('/')})`;
    }

    msg += line + '\n';

    // Precio
    if (prices.length > 0) {
      if (prices[0] === prices[prices.length - 1]) {
        msg += `*${prices[0]} U$*\n`;
      } else {
        msg += `*${prices[0]} a ${prices[prices.length - 1]} U$*\n`;
      }
    }

    msg += '\n';
  });

  return msg.trim();
}

// Obtener grupos de WhatsApp (para selector)
export const getWhatsAppGroups = async (req: AuthRequest, res: Response) => {
  try {
    const { whatsappService } = require('../services/whatsapp.service');
    
    // Obtener grupos del bot
    const groups = await whatsappService.getGroups();
    
    res.json({ groups });
  } catch (error) {
    console.error('Error getting groups:', error);
    res.status(400).json({ error: 'Error al obtener grupos' });
  }
};
