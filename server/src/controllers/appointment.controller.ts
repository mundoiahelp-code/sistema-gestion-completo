import { Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

// Obtener todos los turnos (con filtros)
export const getAppointments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { status, date, search, storeId } = req.query;

    const where: any = { tenantId };

    // Filtro por estado
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filtro por fecha
    if (date) {
      const startDate = new Date(date as string);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      where.date = {
        gte: startDate,
        lt: endDate,
      };
    }

    // Filtro por sucursal
    if (storeId) {
      where.storeId = storeId;
    }

    // Búsqueda por nombre o teléfono
    if (search) {
      where.OR = [
        { customerName: { contains: search as string, mode: 'insensitive' } },
        { customerPhone: { contains: search as string } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        store: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, phone: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
    });

    res.json({ appointments });
  } catch (error) {
    next(error);
  }
};

// Obtener un turno por ID
export const getAppointmentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const appointment = await prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        store: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, phone: true, email: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    });

    if (!appointment) {
      throw new AppError('Turno no encontrado', 404);
    }

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
};

// Crear turno
export const createAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const {
      date,
      time,
      customerName,
      customerPhone,
      productId,
      product,
      storeId,
      notes,
      clientId,
    } = req.body;

    // Validaciones básicas
    if (!date || !time || !customerName || !customerPhone) {
      throw new AppError('Faltan campos requeridos', 400);
    }

    console.log('📝 Creating appointment:', {
      date,
      time,
      customerName,
      customerPhone,
      productId,
      storeId,
      tenantId,
    });

    // Si hay productId, reservar el producto
    if (productId) {
      const productData = await prisma.product.findFirst({
        where: { id: productId, tenantId, active: true },
      });

      if (!productData) {
        throw new AppError('Producto no encontrado', 404);
      }

      // Validar que haya stock total (sin importar si está reservado)
      if (productData.stock < 1) {
        throw new AppError('Producto sin stock disponible', 400);
      }

      // Incrementar reserva
      await prisma.product.update({
        where: { id: productId },
        data: { reserved: { increment: 1 } },
      });
    }

    // Validar storeId si se proporciona
    if (storeId) {
      const storeExists = await prisma.store.findFirst({
        where: { id: storeId, tenantId },
      });
      
      if (!storeExists) {
        throw new AppError('Sucursal no encontrada', 404);
      }
    }

    // Construir data object solo con campos definidos
    const appointmentData: any = {
      date: new Date(date),
      time,
      customerName,
      customerPhone,
      tenantId,
      status: 'PENDING',
      assignedUserId: req.user?.id, // Guardar quién creó el turno
    };

    // Solo agregar campos opcionales si están definidos y no son strings vacíos
    if (productId) appointmentData.productId = productId;
    if (product) appointmentData.product = product;
    if (storeId) appointmentData.storeId = storeId;
    if (notes) appointmentData.notes = notes;
    if (clientId) appointmentData.clientId = clientId;

    console.log('💾 Creating appointment with data:', appointmentData);

    const appointment = await prisma.appointment.create({
      data: appointmentData,
      include: {
        store: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, phone: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ appointment });
  } catch (error: any) {
    console.error('❌ Error creating appointment:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);
    next(error);
  }
};

// Actualizar turno
export const updateAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const {
      date,
      time,
      customerName,
      customerPhone,
      productId,
      product,
      storeId,
      notes,
      status,
    } = req.body;

    const existing = await prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new AppError('Turno no encontrado', 404);
    }

    // Si cambió el producto, ajustar reservas
    if (productId && productId !== existing.productId) {
      // Liberar producto anterior
      if (existing.productId) {
        await prisma.product.update({
          where: { id: existing.productId },
          data: { reserved: { decrement: 1 } },
        });
      }

      // Reservar nuevo producto
      const newProduct = await prisma.product.findFirst({
        where: { id: productId, tenantId, active: true },
      });

      if (!newProduct) {
        throw new AppError('Producto no encontrado', 404);
      }

      // Validar que haya stock total (sin importar si está reservado)
      if (newProduct.stock < 1) {
        throw new AppError('Producto sin stock disponible', 400);
      }

      await prisma.product.update({
        where: { id: productId },
        data: { reserved: { increment: 1 } },
      });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(time && { time }),
        ...(customerName && { customerName }),
        ...(customerPhone && { customerPhone }),
        ...(productId !== undefined && { productId }),
        ...(product !== undefined && { product }),
        ...(storeId !== undefined && { storeId }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
      },
      include: {
        store: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, phone: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ appointment });
  } catch (error) {
    next(error);
  }
};

// Marcar como atendido (confirma venta)
export const attendAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    const appointment = await prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!appointment) {
      throw new AppError('Turno no encontrado', 404);
    }

    if (appointment.status === 'ATTENDED') {
      throw new AppError('El turno ya fue atendido', 400);
    }

    // Si hay producto reservado, crear venta y liberar reserva
    if (appointment.productId) {
      const product = await prisma.product.findUnique({
        where: { id: appointment.productId },
      });

      if (!product) {
        throw new AppError('Producto no encontrado', 404);
      }

      // Crear venta
      await prisma.sale.create({
        data: {
          total: product.price,
          paymentMethod: appointment.paymentMethod || 'EFECTIVO',
          notes: `Venta de turno - ${appointment.customerName}`,
          tenantId,
          userId: userId!,
          storeId: appointment.storeId || product.storeId,
          clientId: appointment.clientId,
          items: {
            create: {
              productId: product.id,
              quantity: 1,
              price: product.price,
              subtotal: product.price,
            },
          },
        },
      });

      // Decrementar stock y reserva, y marcar como inactivo si stock llega a 0
      const updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: {
          stock: { decrement: 1 },
          reserved: { decrement: 1 },
        },
      });

      // Si el stock llegó a 0, marcar como inactivo
      if (updatedProduct.stock === 0) {
        await prisma.product.update({
          where: { id: product.id },
          data: { active: false },
        });
      }
    }

    // Marcar turno como atendido
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'ATTENDED',
        attendedAt: new Date(),
      },
      include: {
        store: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, phone: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ appointment: updated });
  } catch (error) {
    next(error);
  }
};

// Cancelar turno
export const cancelAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const { cancelReason } = req.body;

    const appointment = await prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!appointment) {
      throw new AppError('Turno no encontrado', 404);
    }

    if (appointment.status === 'CANCELLED') {
      throw new AppError('El turno ya está cancelado', 400);
    }

    // Liberar producto reservado
    if (appointment.productId) {
      await prisma.product.update({
        where: { id: appointment.productId },
        data: { reserved: { decrement: 1 } },
      });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason,
        cancelledAt: new Date(),
      },
      include: {
        store: { select: { id: true, name: true } },
        client: { select: { id: true, name: true, phone: true } },
        assignedUser: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ appointment: updated });
  } catch (error) {
    next(error);
  }
};

// Eliminar turno (solo si está cancelado o atendido - historial)
export const deleteAppointment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const appointment = await prisma.appointment.findFirst({
      where: { id, tenantId },
    });

    if (!appointment) {
      throw new AppError('Turno no encontrado', 404);
    }

    // Solo permitir eliminar si está en el historial (cancelado o atendido)
    if (!['CANCELLED', 'ATTENDED'].includes(appointment.status)) {
      throw new AppError('Solo se pueden eliminar turnos del historial (cancelados o atendidos)', 400);
    }

    await prisma.appointment.delete({ where: { id } });

    res.json({ message: 'Turno eliminado' });
  } catch (error) {
    next(error);
  }
};
