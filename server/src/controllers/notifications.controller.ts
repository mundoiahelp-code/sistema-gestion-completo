import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    // Si no existen preferencias, crear con valores por defecto
    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: { userId },
      });
    }

    return res.json(preferences);
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      botNewMessage,
      botEscalation,
      saleCompleted,
      saleHighValue,
      appointmentNew,
      appointmentReminder,
      appointmentCancelled,
      stockLow,
      newClient,
    } = req.body;

    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId },
      update: {
        botNewMessage,
        botEscalation,
        saleCompleted,
        saleHighValue,
        appointmentNew,
        appointmentReminder,
        appointmentCancelled,
        stockLow,
        newClient,
      },
      create: {
        userId,
        botNewMessage,
        botEscalation,
        saleCompleted,
        saleHighValue,
        appointmentNew,
        appointmentReminder,
        appointmentCancelled,
        stockLow,
        newClient,
      },
    });

    return res.json({ message: 'Preferences updated', preferences });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
