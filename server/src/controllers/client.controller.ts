import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendWhatsAppNotification } from './notification.controller';

const clientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  dni: z.string().optional(),
  active: z.boolean().optional()
});

export const getClients = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const tenantId = req.user?.tenantId;
    
    // Validar límites de paginación
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit))); // Máximo 100 registros
    
    const clients = await prisma.client.findMany({
      where: {
        active: true,
        tenantId, // FILTRAR POR TENANT
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string, mode: 'insensitive' } }
        ]
      },
      include: {
        _count: { select: { sales: true, orders: true } }
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.client.count({
      where: {
        active: true,
        tenantId, // FILTRAR POR TENANT
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } }
        ]
      }
    });

    res.json({ clients, total, page: pageNum, limit: limitNum });
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener clientes' });
  }
};

export const getClient = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        sales: { take: 10, orderBy: { createdAt: 'desc' } },
        orders: { take: 10, orderBy: { createdAt: 'desc' } }
      }
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ client });
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener cliente' });
  }
};

export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const data = clientSchema.parse(req.body);
    const tenantId = req.user!.tenantId;

    const client = await prisma.client.create({ 
      data: {
        ...data,
        tenantId,
      }
    });

    // Enviar notificación de nuevo cliente
    const message = `👤 *Nuevo cliente registrado*\n\n` +
      `📛 Nombre: ${client.name}\n` +
      `📱 Tel: ${client.phone || 'No especificado'}\n` +
      `📧 Email: ${client.email || 'No especificado'}`;
    
    sendWhatsAppNotification(tenantId, message, 'newClient');

    res.status(201).json({ client });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(400).json({ error: 'Error al crear cliente' });
  }
};

export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    const data = clientSchema.partial().parse(req.body);
    const tenantId = req.user?.tenantId;

    // Verificar que el cliente pertenece al tenant
    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, tenantId }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const client = await prisma.client.update({
      where: { id: req.params.id },
      data
    });

    res.json({ client });
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar cliente' });
  }
};

export const deleteClient = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    // Verificar que el cliente pertenece al tenant
    const existing = await prisma.client.findFirst({
      where: { id: req.params.id, tenantId }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await prisma.client.update({
      where: { id: req.params.id },
      data: { active: false }
    });

    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar cliente' });
  }
};
