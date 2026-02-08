import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const createBlockedSlotSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  reason: z.string().optional(),
  storeId: z.string().optional()
});

// Obtener horarios bloqueados
export const getBlockedTimeSlots = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { date, storeId } = req.query;

    const where: any = { tenantId };
    
    if (date) {
      const targetDate = new Date(date as string);
      where.date = {
        gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        lte: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    }
    
    if (storeId && storeId !== 'all') {
      where.storeId = storeId;
    }

    const blockedSlots = await prisma.blockedTimeSlot.findMany({
      where,
      include: {
        store: {
          select: { id: true, name: true }
        }
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });

    res.json(blockedSlots);
  } catch (error) {
    console.error('Error obteniendo horarios bloqueados:', error);
    res.status(500).json({ error: 'Error al obtener horarios bloqueados' });
  }
};

// Crear horario bloqueado
export const createBlockedTimeSlot = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const data = createBlockedSlotSchema.parse(req.body);

    const blockedSlot = await prisma.blockedTimeSlot.create({
      data: {
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        reason: data.reason,
        storeId: data.storeId,
        tenantId
      },
      include: {
        store: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json(blockedSlot);
  } catch (error) {
    console.error('Error creando horario bloqueado:', error);
    res.status(500).json({ error: 'Error al crear horario bloqueado' });
  }
};

// Eliminar horario bloqueado
export const deleteBlockedTimeSlot = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user!.tenantId;

    // Verificar que pertenezca al tenant
    const blockedSlot = await prisma.blockedTimeSlot.findFirst({
      where: { id, tenantId }
    });

    if (!blockedSlot) {
      return res.status(404).json({ error: 'Horario bloqueado no encontrado' });
    }

    await prisma.blockedTimeSlot.delete({
      where: { id }
    });

    res.json({ message: 'Horario bloqueado eliminado' });
  } catch (error) {
    console.error('Error eliminando horario bloqueado:', error);
    res.status(500).json({ error: 'Error al eliminar horario bloqueado' });
  }
};
