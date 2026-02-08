import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { invalidateTenantCache } from '../lib/cache';

const storeSchema = z.object({
  name: z.string().min(2),
  icon: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  active: z.boolean().optional(),
  // Horarios por día (formato "HH:mm-HH:mm" o null si cerrado)
  mondayHours: z.string().nullable().optional(),
  tuesdayHours: z.string().nullable().optional(),
  wednesdayHours: z.string().nullable().optional(),
  thursdayHours: z.string().nullable().optional(),
  fridayHours: z.string().nullable().optional(),
  saturdayHours: z.string().nullable().optional(),
  sundayHours: z.string().nullable().optional(),
  // Configuración de turnos
  appointmentDuration: z.number().optional(),
  appointmentBuffer: z.number().optional(),
  // Ubicación
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  googleMapsUrl: z.string().nullable().optional()
});

export const getStores = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const stores = await prisma.store.findMany({
      where: { active: true, tenantId }, // FILTRAR POR TENANT
      include: {
        _count: {
          select: { 
            users: true, 
            products: { where: { active: true } }, 
            sales: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ stores });
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener tiendas' });
  }
};

export const getStore = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const store = await prisma.store.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        users: { select: { id: true, name: true, email: true, role: true } },
        products: {
          where: { active: true },
          select: { id: true, name: true, model: true, category: true, stock: true }
        },
        _count: { select: { products: true, sales: true } }
      }
    });

    if (!store) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    // Separar celulares y accesorios
    const phones = store.products.filter(p => p.category === 'PHONE');
    const accessories = store.products.filter(p => p.category === 'ACCESSORY');
    
    // Calcular totales
    const phonesCount = phones.length;
    const accessoriesItems = accessories.length;
    const accessoriesStock = accessories.reduce((sum, a) => sum + a.stock, 0);

    res.json({ 
      store: {
        ...store,
        phonesCount,
        accessoriesItems,
        accessoriesStock,
        phonesList: phones,
        accessoriesList: accessories
      }
    });
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener tienda' });
  }
};

export const createStore = async (req: AuthRequest, res: Response) => {
  try {
    const data = storeSchema.parse(req.body);

    // Obtener el tenantId del usuario autenticado
    if (!req.user?.tenantId) {
      return res.status(400).json({ error: 'Usuario sin tenant asignado' });
    }

    const tenantId = req.user.tenantId;

    // Verificar límite de sucursales según el plan
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true }
    });

    const planLimits: Record<string, number> = {
      trial: 2,
      basic: 5,
      pro: 10
    };

    const maxStores = planLimits[tenant?.plan || 'trial'] || 2;

    // Contar sucursales activas del tenant
    const currentStoreCount = await prisma.store.count({
      where: { tenantId, active: true }
    });

    if (currentStoreCount >= maxStores) {
      const planName = tenant?.plan === 'pro' ? 'Profesional' : tenant?.plan === 'basic' ? 'Básico' : 'Prueba gratuita';
      return res.status(400).json({ 
        error: `Has alcanzado el límite de ${maxStores} sucursales para el plan ${planName}. Actualizá tu plan para agregar más sucursales.` 
      });
    }

    const store = await prisma.store.create({ 
      data: {
        ...data,
        tenantId
      }
    });

    // Invalidar caché del tenant para que el próximo check tenga el conteo actualizado
    invalidateTenantCache(tenantId);

    res.status(201).json({ store });
  } catch (error) {
    console.error('Error creating store:', error);
    res.status(400).json({ error: 'Error al crear tienda' });
  }
};

export const updateStore = async (req: AuthRequest, res: Response) => {
  try {
    const data = storeSchema.partial().parse(req.body);
    const tenantId = req.user?.tenantId;

    console.log('📝 Datos recibidos para actualizar store:', JSON.stringify(data, null, 2));

    // Verificar que la tienda pertenece al tenant
    const existing = await prisma.store.findFirst({
      where: { id: req.params.id, tenantId }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    const store = await prisma.store.update({
      where: { id: req.params.id },
      data
    });

    console.log('✅ Store actualizado:', JSON.stringify(store, null, 2));

    res.json({ store });
  } catch (error) {
    console.error('❌ Error al actualizar store:', error);
    res.status(400).json({ error: 'Error al actualizar tienda' });
  }
};

export const deleteStore = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;

    // Verificar que la tienda pertenece al tenant
    const existing = await prisma.store.findFirst({
      where: { id: req.params.id, tenantId }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    await prisma.store.update({
      where: { id: req.params.id },
      data: { active: false }
    });

    // Invalidar caché del tenant para que el próximo check tenga el conteo actualizado
    invalidateTenantCache(tenantId!);

    res.json({ message: 'Tienda eliminada' });
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar tienda' });
  }
};
