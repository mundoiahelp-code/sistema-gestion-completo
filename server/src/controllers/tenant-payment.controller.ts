import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Obtener pagos de un tenant
export const getTenantPayments = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;

    const payments = await prisma.payment.findMany({
      where: { tenantId },
      orderBy: { paidAt: 'desc' }
    });

    res.json(payments);
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(400).json({ error: 'Error al obtener pagos' });
  }
};

// Registrar un nuevo pago de tenant (super admin)
export const createTenantPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { amount, method, notes, extendDays } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Monto inválido' });
    }

    // Crear el pago
    const payment = await prisma.payment.create({
      data: {
        tenantId,
        amount: parseFloat(amount),
        method: method || 'Efectivo',
        notes: notes || null,
        status: 'completed'
      }
    });

    // Extender el plan si se especificó
    if (extendDays && extendDays > 0) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (tenant) {
        const currentExpires = tenant.planExpires ? new Date(tenant.planExpires) : new Date();
        const newExpires = new Date(currentExpires);
        newExpires.setDate(newExpires.getDate() + parseInt(extendDays));

        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            planExpires: newExpires,
            paymentStatus: 'paid',
            lastPaymentDate: new Date()
          }
        });
      }
    }

    res.status(201).json({ payment, message: 'Pago registrado exitosamente' });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(400).json({ error: 'Error al registrar pago' });
  }
};

// Actualizar precio del plan
export const updateTenantPrice = async (req: AuthRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const { planPrice } = req.body;

    if (planPrice === undefined || planPrice < 0) {
      return res.status(400).json({ error: 'Precio inválido' });
    }

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { planPrice: parseFloat(planPrice) }
    });

    res.json({ tenant, message: 'Precio actualizado' });
  } catch (error) {
    console.error('Error updating price:', error);
    res.status(400).json({ error: 'Error al actualizar precio' });
  }
};
