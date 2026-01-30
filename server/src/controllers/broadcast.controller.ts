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

    // Verificar que el canal pertenece al tenant
    const channel = await prisma.broadcastChannel.findFirst({
      where: { id, tenantId },
    });

    if (!channel) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }

    let messagesSent = 0;

    // Si sendStock es true, enviar lista de precios (2 mensajes)
    if (channel.sendStock) {
      try {
        // Mensaje 1: iPhones
        const phonesMessage = await generatePhonesStockMessage(tenantId);
        const sent1 = await sendMessageToWhatsAppGroup(channel.chatId, phonesMessage, tenantId);
        
        if (sent1) {
          messagesSent++;
          console.log('✅ Mensaje de iPhones enviado');
        }
      } catch (error) {
        console.error('Error enviando mensaje de iPhones:', error);
      }

      try {
        // Mensaje 2: Accesorios
        const accessoriesMessage = await generateAccessoriesStockMessage(tenantId);
        const sent2 = await sendMessageToWhatsAppGroup(channel.chatId, accessoriesMessage, tenantId);
        
        if (sent2) {
          messagesSent++;
          console.log('✅ Mensaje de accesorios enviado');
        }
      } catch (error) {
        console.error('Error enviando mensaje de accesorios:', error);
      }

      if (messagesSent === 0) {
        return res.status(500).json({ error: 'No se pudo enviar ningún mensaje' });
      }
    } else {
      // Enviar mensaje personalizado
      const finalMessage = channel.message || '';
      if (!finalMessage) {
        return res.status(400).json({ error: 'No hay mensaje configurado' });
      }

      const sent = await sendMessageToWhatsAppGroup(channel.chatId, finalMessage, tenantId);
      
      if (!sent) {
        return res.status(500).json({ error: 'Error al enviar mensaje' });
      }
      messagesSent = 1;
    }

    // Actualizar lastSent
    await prisma.broadcastChannel.update({
      where: { id },
      data: { lastSent: new Date() },
    });

    res.json({ 
      success: true, 
      message: `${messagesSent} mensaje${messagesSent > 1 ? 's' : ''} enviado${messagesSent > 1 ? 's' : ''}`,
      chatId: channel.chatId 
    });
  } catch (error) {
    console.error('Error sending to channel:', error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
};

// Generar mensaje de stock de iPhones
async function generatePhonesStockMessage(tenantId: string): Promise<string> {
  const products = await prisma.product.findMany({
    where: {
      tenantId,
      active: true,
      stock: { gt: 0 },
      reserved: { equals: 0 },
      category: 'PHONE',
    },
    orderBy: [{ model: 'asc' }, { storage: 'asc' }],
  });

  if (products.length === 0) {
    return '⚡️ *IPHONES - STOCK DISPONIBLE* ⚡️\n*ENVIOS A TODO EL PAIS*\n\nSin stock disponible por el momento';
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

  let msg = '⚡️ *IPHONES - STOCK DISPONIBLE ENTREGA INMEDIATA* ⚡️\n';
  msg += '*ENVIOS A TODO EL PAIS*\n\n';

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

    if (batteries.length > 0) {
      if (batteries[0] === batteries[batteries.length - 1]) {
        line += ` ${batteries[0]}%`;
      } else {
        line += ` ${batteries[0]}% a ${batteries[batteries.length - 1]}%`;
      }
    }

    if (colors.length > 0) {
      line += ` (${colors.join('/')})`;
    }

    msg += line + '\n';

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

// Generar mensaje de stock de accesorios
async function generateAccessoriesStockMessage(tenantId: string): Promise<string> {
  const accessories = await prisma.accessory.findMany({
    where: {
      tenantId,
      active: true,
      stock: { gt: 0 },
    },
    orderBy: { name: 'asc' },
  });

  if (accessories.length === 0) {
    return '🎧 *ACCESORIOS - STOCK DISPONIBLE* 🎧\n*ENVIOS A TODO EL PAIS*\n\nSin stock disponible por el momento';
  }

  let msg = '🎧 *ACCESORIOS - STOCK DISPONIBLE* 🎧\n';
  msg += '*ENVIOS A TODO EL PAIS*\n\n';

  accessories.forEach(acc => {
    msg += `· ${acc.name}`;
    if (acc.stock) {
      msg += ` (Stock: ${acc.stock})`;
    }
    if (acc.price) {
      msg += ` - *${acc.price} U$*`;
    }
    msg += '\n';
  });

  return msg.trim();
}

// Enviar mensaje a grupo de WhatsApp via bot multi-tenant
async function sendMessageToWhatsAppGroup(chatId: string, message: string, tenantId: string): Promise<boolean> {
  try {
    const axios = require('axios');
    const BOT_URL = process.env.WHATSAPP_BOT_URL || 'http://localhost:3001';
    
    console.log(`📤 Enviando a grupo ${chatId} (tenant: ${tenantId})`);
    
    const response = await axios.post(
      `${BOT_URL}/api/send-message`,
      { phone: chatId, message },
      { 
        headers: { 'X-Tenant-ID': tenantId },
        timeout: 10000 
      }
    );
    
    return response.data.success === true;
  } catch (error: any) {
    console.error('Error enviando a grupo:', error.message);
    return false;
  }
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
