import { prisma } from '../lib/prisma';
import { whatsappService } from './whatsapp.service';

class BroadcastService {
  private intervalId: NodeJS.Timeout | null = null;

  // Iniciar el scheduler
  start() {
    console.log('📢 Broadcast scheduler iniciado');
    
    // Verificar cada minuto
    this.intervalId = setInterval(() => {
      this.checkAndSendBroadcasts();
    }, 60000); // 1 minuto

    // También verificar al iniciar
    setTimeout(() => this.checkAndSendBroadcasts(), 5000);
  }

  // Detener el scheduler
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('📢 Broadcast scheduler detenido');
    }
  }

  // Verificar y enviar broadcasts programados
  async checkAndSendBroadcasts() {
    try {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      // Buscar canales que deben enviar ahora
      const channels = await prisma.broadcastChannel.findMany({
        where: {
          enabled: true,
          sendTime: currentTime,
        },
      });

      for (const channel of channels) {
        // Verificar si debe enviar según la frecuencia
        if (channel.lastSent) {
          const daysSinceLastSent = Math.floor(
            (now.getTime() - new Date(channel.lastSent).getTime()) / (1000 * 60 * 60 * 24)
          );
          
          // Si no han pasado suficientes días según la frecuencia, saltar
          if (daysSinceLastSent < (channel.frequency || 1)) {
            console.log(`⏭️ Canal ${channel.name}: faltan ${(channel.frequency || 1) - daysSinceLastSent} días para el próximo envío`);
            continue;
          }
        }

        await this.sendBroadcast(channel);
      }
    } catch (error) {
      console.error('Error checking broadcasts:', error);
    }
  }

  // Enviar broadcast a un canal
  async sendBroadcast(channel: any) {
    try {
      console.log(`📢 Enviando broadcast a: ${channel.name} (${channel.chatId})`);

      let message = channel.message || '';

      // Generar stock si es necesario
      if (channel.sendStock || message.includes('{stock}')) {
        const stockText = await this.generateStockMessage(channel.tenantId);
        message = message ? message.replace('{stock}', stockText) : stockText;
      }

      if (!message) {
        console.log(`⚠️ Canal ${channel.name} sin mensaje configurado`);
        return;
      }

      // Enviar via WhatsApp (multi-tenant)
      const sent = await whatsappService.sendMessageToGroup(channel.chatId, message, channel.tenantId);
      if (sent) {
        console.log(`✅ Broadcast enviado a ${channel.name}`);
      } else {
        console.log(`⚠️ No se pudo enviar broadcast a ${channel.name}`);
        return;
      }

      // Actualizar lastSent
      await prisma.broadcastChannel.update({
        where: { id: channel.id },
        data: { lastSent: new Date() },
      });

    } catch (error) {
      console.error(`Error enviando broadcast a ${channel.name}:`, error);
    }
  }

  // Generar mensaje de stock
  async generateStockMessage(tenantId: string): Promise<string> {
    const products = await prisma.product.findMany({
      where: {
        tenantId,
        active: true,
        stock: { gt: 0 },
        reserved: { equals: 0 }, // Solo no reservados
        category: 'PHONE',
      },
      orderBy: [{ model: 'asc' }, { storage: 'desc' }],
    });

    if (products.length === 0) {
      return '📱 Sin stock disponible por el momento';
    }

    // Agrupar por modelo
    const grouped: Record<string, any[]> = {};
    products.forEach(p => {
      const key = p.model || p.name;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(p);
    });

    let msg = '📱 *STOCK DISPONIBLE*\n';
    msg += `_${new Date().toLocaleDateString('es-AR')}_\n\n`;
    
    Object.entries(grouped).forEach(([model, items]) => {
      msg += `*${model}*\n`;
      items.forEach(item => {
        const battery = item.battery ? ` bat ${item.battery}%` : '';
        const color = item.color ? ` ${item.color}` : '';
        msg += `• ${item.storage || ''}${color}${battery} - USD $${item.price}\n`;
      });
      msg += '\n';
    });

    msg += '📲 _Consultá por privado!_';
    
    return msg;
  }

  // Enviar manualmente a un canal
  async sendManual(channelId: string, customMessage?: string) {
    const channel = await prisma.broadcastChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new Error('Canal no encontrado');
    }

    let message = customMessage || channel.message || '';

    if (channel.sendStock || message.includes('{stock}')) {
      const stockText = await this.generateStockMessage(channel.tenantId);
      message = message ? message.replace('{stock}', stockText) : stockText;
    }

    const sent = await whatsappService.sendMessageToGroup(channel.chatId, message, channel.tenantId);
    if (!sent) {
      throw new Error('WhatsApp no conectado o error al enviar');
    }

    await prisma.broadcastChannel.update({
      where: { id: channelId },
      data: { lastSent: new Date() },
    });

    return { success: true, message };
  }
}

export const broadcastService = new BroadcastService();
