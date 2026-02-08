import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { whatsappService } from '../services/whatsapp.service';

// Obtener preferencias de notificaciones
export const getPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    let prefs = await prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!prefs) {
      // Crear preferencias por defecto
      prefs = await prisma.notificationPreferences.create({
        data: {
          userId,
          botNewMessage: true,
          botEscalation: true,
          saleCompleted: true,
          saleHighValue: true,
          appointmentNew: true,
          appointmentReminder: true,
          appointmentCancelled: false,
          stockLow: true,
          newClient: false,
        },
      });
    }

    res.json(prefs);
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({ error: 'Error al obtener preferencias' });
  }
};

// Actualizar preferencias
export const updatePreferences = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const preferences = req.body;

    const updated = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: preferences,
      create: {
        userId,
        ...preferences,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Error al actualizar preferencias' });
  }
};

// Obtener números de WhatsApp configurados
export const getWhatsAppNumbers = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const numbers = await prisma.whatsAppNotificationNumber.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    res.json(numbers);
  } catch (error) {
    console.error('Error getting WhatsApp numbers:', error);
    res.status(500).json({ error: 'Error al obtener números' });
  }
};

// Agregar número de WhatsApp
export const addWhatsAppNumber = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Nombre y teléfono son requeridos' });
    }

    // Verificar que no exista ya
    const existing = await prisma.whatsAppNotificationNumber.findFirst({
      where: { tenantId, phone },
    });

    if (existing) {
      return res.status(400).json({ error: 'Este número ya está registrado' });
    }

    const number = await prisma.whatsAppNotificationNumber.create({
      data: {
        tenantId,
        name,
        phone,
        enabled: true,
      },
    });

    res.json(number);
  } catch (error) {
    console.error('Error adding WhatsApp number:', error);
    res.status(500).json({ error: 'Error al agregar número' });
  }
};

// Actualizar número de WhatsApp
export const updateWhatsAppNumber = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    const tenantId = req.user!.tenantId;

    const number = await prisma.whatsAppNotificationNumber.findFirst({
      where: { id, tenantId },
    });

    if (!number) {
      return res.status(404).json({ error: 'Número no encontrado' });
    }

    const updated = await prisma.whatsAppNotificationNumber.update({
      where: { id },
      data: { enabled },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating WhatsApp number:', error);
    res.status(500).json({ error: 'Error al actualizar número' });
  }
};

// Eliminar número de WhatsApp
export const deleteWhatsAppNumber = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    const number = await prisma.whatsAppNotificationNumber.findFirst({
      where: { id, tenantId },
    });

    if (!number) {
      return res.status(404).json({ error: 'Número no encontrado' });
    }

    await prisma.whatsAppNotificationNumber.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting WhatsApp number:', error);
    res.status(500).json({ error: 'Error al eliminar número' });
  }
};

// Mapeo de tipos de notificación a campos de preferencias
const notificationTypeMap: Record<string, string> = {
  botNewMessage: 'botNewMessage',
  botEscalation: 'botEscalation',
  saleCompleted: 'saleCompleted',
  saleHighValue: 'saleHighValue',
  appointmentNew: 'appointmentNew',
  appointmentReminder: 'appointmentReminder',
  appointmentCancelled: 'appointmentCancelled',
  stockLow: 'stockLow',
  newClient: 'newClient',
};

// Función helper para enviar notificaciones por WhatsApp
export async function sendWhatsAppNotification(
  tenantId: string,
  message: string,
  notificationType: string
) {
  try {
    // Verificar preferencias globales del tenant (buscar admin)
    const adminUser = await prisma.user.findFirst({
      where: { tenantId, role: 'ADMIN' },
    });

    if (adminUser) {
      const prefs = await prisma.notificationPreferences.findUnique({
        where: { userId: adminUser.id },
      });

      const prefField = notificationTypeMap[notificationType];
      
      // Si tiene preferencias y este tipo está desactivado, no enviar
      if (prefs && prefField && (prefs as any)[prefField] === false) {
        console.log(`⏭️ Notificación [${notificationType}] desactivada en preferencias`);
        return;
      }
    }

    // Obtener números habilitados
    const numbers = await prisma.whatsAppNotificationNumber.findMany({
      where: {
        tenantId,
        enabled: true,
      },
    });

    if (numbers.length === 0) {
      console.log('📭 No hay números configurados para notificaciones');
      return;
    }

    // Verificar si WhatsApp está conectado
    const status = whatsappService.getStatus();
    if (!status.connected) {
      console.log('📵 WhatsApp no está conectado, no se puede enviar notificación');
      return;
    }

    // Enviar a cada número
    for (const number of numbers) {
      try {
        await whatsappService.sendMessage(number.phone, message);
        console.log(`✅ Notificación [${notificationType}] enviada a ${number.name} (${number.phone})`);
      } catch (error) {
        console.error(`❌ Error enviando a ${number.name}:`, error);
      }
    }
  } catch (error) {
    console.error('Error sending WhatsApp notifications:', error);
  }
}
