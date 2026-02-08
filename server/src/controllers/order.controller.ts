import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive()
});

const orderSchema = z.object({
  total: z.number().positive(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
  clientId: z.string().uuid().optional(),
  items: z.array(orderItemSchema).min(1)
});

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const tenantId = req.user?.tenantId;
    
    const where: any = { tenantId }; // FILTRAR POR TENANT
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, model: true, stock: true, category: true } }
          }
        }
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.order.count({ where });

    // Agregar totalItems, code y category a cada orden
    const ordersWithTotals = orders.map((order) => {
      // Determinar categoría basada en los items
      const categories = order.items.map(item => item.product?.category).filter(Boolean);
      const uniqueCategories = [...new Set(categories)];
      let category = 'MIXED';
      if (uniqueCategories.length === 1) {
        category = uniqueCategories[0] as string;
      } else if (uniqueCategories.length === 0) {
        category = 'UNKNOWN';
      }

      return {
        ...order,
        totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
        code: order.id.slice(-6).toUpperCase(),
        vendor: order.user?.name || 'Sin asignar',
        category,
      };
    });

    res.json({ orders: ordersWithTotals, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener pedidos' });
  }
};

export const getOrder = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, tenantId }, // FILTRAR POR TENANT
      include: {
        client: true,
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: { product: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json({ order });
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener pedido' });
  }
};

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const data = orderSchema.parse(req.body);
    const tenantId = req.user!.tenantId;

    const order = await prisma.order.create({
      data: {
        total: data.total,
        status: data.status || 'PENDING',
        notes: data.notes,
        clientId: data.clientId,
        userId: req.user!.id,
        tenantId,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.quantity * item.price
          }))
        }
      },
      include: {
        items: { include: { product: true } },
        client: true,
        user: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({ order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ error: 'Error al crear pedido' });
  }
};

export const updateOrder = async (req: AuthRequest, res: Response) => {
  try {
    const data = orderSchema.partial().parse(req.body);

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        total: data.total,
        status: data.status,
        notes: data.notes
      },
      include: {
        items: { include: { product: true } },
        client: true,
        user: { select: { id: true, name: true } }
      }
    });

    res.json({ order });
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar pedido' });
  }
};

export const deleteOrder = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.order.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Pedido eliminado' });
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar pedido' });
  }
};
