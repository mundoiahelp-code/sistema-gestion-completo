import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { sendWhatsAppNotification } from './notification.controller';
import { asyncHandler } from '../middleware/errorHandler';
import { validateStock, validateSaleLogic, validateReferences } from '../lib/validators';
import { validatePagination } from '../lib/pagination';

const saleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  storeId: z.string().uuid().optional() // Sucursal específica para descontar stock
});

const saleSchema = z.object({
  total: z.number().positive(),
  discount: z.number().min(0).optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'MIXED']),
  saleType: z.enum(['RETAIL', 'WHOLESALE']).optional(),
  notes: z.string().optional(),
  clientId: z.string().uuid().optional(),
  storeId: z.string().uuid(),
  items: z.array(saleItemSchema).min(1)
});

export const getSales = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { storeId, startDate, endDate } = req.query;
  const tenantId = req.user?.tenantId;
  
  // Validar paginación
  const { page, limit, skip } = validatePagination(req.query.page, req.query.limit);
  
  const where: any = { tenantId }; // FILTRAR POR TENANT
  if (storeId) where.storeId = storeId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate as string);
    if (endDate) where.createdAt.lte = new Date(endDate as string);
  }
  
  const sales = await prisma.sale.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      user: { select: { id: true, name: true } },
      store: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, model: true } } } }
    },
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
  
  const total = await prisma.sale.count({ where });
  res.json({ sales, total, page, limit });
});


export const getSale = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tenantId = req.user?.tenantId;
  
  const sale = await prisma.sale.findFirst({
    where: { id: req.params.id, tenantId },
    include: {
      client: true,
      user: { select: { id: true, name: true, email: true } },
      store: true,
      items: { include: { product: true } }
    }
  });
  
  if (!sale) {
    return res.status(404).json({ error: 'Venta no encontrada' });
  }
  
  res.json({ sale });
});

export const createSale = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = saleSchema.parse(req.body);
  const tenantId = req.user!.tenantId;
  
  // VALIDACIONES CRÍTICAS ANTES DE CREAR VENTA
  // 1. Validar lógica de negocio
  validateSaleLogic(data);
  
  // 2. Validar referencias (cliente, sucursal)
  await validateReferences({
    clientId: data.clientId,
    storeId: data.storeId,
    tenantId
  });
  
  // 3. Validar stock disponible
  await validateStock(data.items, tenantId);
  
  // Crear venta con transacción SERIALIZABLE (previene race conditions)
  const sale = await prisma.$transaction(async (tx) => {
      // Resolver productIds correctos para accesorios con sucursal específica
      const resolvedItems = [];
      for (const item of data.items) {
        let productId = item.productId;
        
        // Si el item tiene storeId específico, buscar el producto correcto de esa sucursal
        if ((item as any).storeId) {
          const originalProduct = await tx.product.findUnique({
            where: { id: item.productId }
          });
          
          if (originalProduct && originalProduct.category === 'ACCESSORY') {
            // Buscar el producto con el mismo nombre en la sucursal indicada
            const productInStore = await tx.product.findFirst({
              where: {
                name: originalProduct.name,
                storeId: (item as any).storeId,
                category: 'ACCESSORY',
                active: true,
                stock: { gte: item.quantity }
              }
            });
            
            if (productInStore) {
              productId = productInStore.id;
            }
          }
        }
        
        resolvedItems.push({
          productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price
        });
      }

      const newSale = await tx.sale.create({
        data: {
          total: data.total,
          discount: data.discount || 0,
          paymentMethod: data.paymentMethod,
          saleType: data.saleType || 'RETAIL',
          notes: data.notes,
          clientId: data.clientId,
          userId: req.user!.id,
          storeId: data.storeId,
          tenantId,
          items: {
            create: resolvedItems
          }
        },
        include: {
          items: { include: { product: true } },
          client: true,
          user: { select: { id: true, name: true } },
          store: true
        }
      });

      // Descontar stock de los productos correctos
      for (const item of resolvedItems) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (product) {
          const newStock = product.stock - item.quantity;
          await tx.product.update({
            where: { id: item.productId },
            data: { 
              stock: newStock,
              // Solo desactivar si es celular (tiene IMEI) o si el stock llega a 0
              active: product.imei ? false : newStock > 0
            }
          });
        }
      }
      return newSale;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000 // 10 segundos máximo
    });

    // Notificaciones FUERA de la transacción (si fallan, no afectan la venta)
    // Calcular totales por moneda (iPhones = USD, Accesorios = ARS)
    let totalUSD = 0;
    let totalARS = 0;
    
    for (const item of sale.items) {
      const isAccessory = item.product.category === 'ACCESSORY';
      if (isAccessory) {
        totalARS += item.subtotal;
      } else {
        totalUSD += item.subtotal;
      }
    }

    // Determinar si es venta de alto valor (USD >= 1500 o ARS >= 500000)
    const isHighValue = totalUSD >= 1500 || totalARS >= 500000;
    
    // Construir mensaje de notificación
    const productNames = sale.items.map(i => {
      const name = i.product.name || i.product.model;
      const qty = i.quantity > 1 ? ` x${i.quantity}` : '';
      return name + qty;
    }).join(', ');
    
    const title = isHighValue ? '💰 VENTA DE ALTO VALOR' : '✅ Nueva venta registrada';
    
    let totalesStr = '';
    if (totalUSD > 0) totalesStr += `\n💵 Total USD: $${totalUSD.toLocaleString('es-AR')}`;
    if (totalARS > 0) totalesStr += `\n💵 Total ARS: $${totalARS.toLocaleString('es-AR')}`;
    
    const msg = `*${title}*\n${totalesStr}\n\n📦 Productos: ${productNames}\n👤 Vendedor: ${sale.user.name}\n🏪 Tienda: ${sale.store.name}\n📅 ${new Date().toLocaleString('es-AR')}`;
    
    // Enviar notificaciones de forma asíncrona (no bloquear respuesta)
    sendWhatsAppNotification(tenantId, msg, isHighValue ? 'saleHighValue' : 'saleCompleted').catch(err => {
      console.error('Error enviando notificación de venta:', err);
    });

    // Verificar stock bajo después de la venta
    for (const item of sale.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { store: true }
      });
      
      if (product && product.stock > 0 && product.stock < 3) {
        const stockMsg = `⚠️ *STOCK BAJO*\n\n📦 Producto: ${product.name || product.model}\n📊 Stock actual: ${product.stock} unidades\n🏪 Tienda: ${product.store?.name || 'N/A'}`;
        sendWhatsAppNotification(tenantId, stockMsg, 'stockLow').catch(err => {
          console.error('Error enviando notificación de stock bajo:', err);
        });
      }
    }

    res.status(201).json({ sale });
});


export const updateSale = async (req: AuthRequest, res: Response) => {
  try {
    const data = saleSchema.partial().parse(req.body);
    const sale = await prisma.sale.update({
      where: { id: req.params.id },
      data: {
        total: data.total,
        discount: data.discount,
        paymentMethod: data.paymentMethod,
        notes: data.notes
      },
      include: {
        items: { include: { product: true } },
        client: true,
        user: { select: { id: true, name: true } }
      }
    });
    res.json({ sale });
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar venta' });
  }
};

export const deleteSale = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: req.params.id },
        include: { items: { include: { product: true } } }
      });
      if (!sale) throw new Error('Venta no encontrada');
      
      // Obtener información del usuario
      const user = await tx.user.findUnique({
        where: { id: req.user!.id },
        select: { name: true }
      });
      
      // Devolver stock
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity }, active: true }
        });
      }
      
      // Registrar auditoría de cancelación con detalles
      const productNames = sale.items.map(i => {
        const productName = i.product?.name || i.product?.model || 'Producto';
        return `${productName} x${i.quantity}`;
      }).join(', ');
      
      await tx.auditLog.create({
        data: {
          userId: req.user!.id,
          userName: user?.name || req.user!.email,
          userRole: req.user!.role,
          tenantId: req.user!.tenantId,
          action: 'CANCEL',
          entity: 'SALE',
          entityId: sale.id,
          entityName: `Venta #${sale.id.slice(-6).toUpperCase()}`,
          changes: JSON.stringify({
            total: sale.total,
            products: productNames,
            stockRestored: true
          }),
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown'
        }
      });
      
      await tx.sale.delete({ where: { id: req.params.id } });
    });
    res.json({ message: 'Venta cancelada y stock devuelto' });
  } catch (error) {
    console.error('Error cancelling sale:', error);
    res.status(400).json({ error: 'Error al cancelar venta' });
  }
};

// Exportar ventas nuevas a PDF (solo las que no se exportaron antes)
export const exportSalesToPDF = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    // Obtener última fecha de exportación
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { lastSalesExportAt: true, name: true }
    });
    
    const lastExport = tenant?.lastSalesExportAt;
    
    // Obtener ventas nuevas (desde última exportación o todas si es primera vez)
    const where: any = { tenantId, cancelled: false };
    if (lastExport) {
      where.createdAt = { gt: lastExport };
    }
    
    const sales = await prisma.sale.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, phone: true } },
        user: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        items: { 
          include: { 
            product: { 
              select: { 
                id: true, 
                name: true, 
                model: true, 
                storage: true, 
                color: true, 
                imei: true,
                category: true 
              } 
            } 
          } 
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    if (sales.length === 0) {
      return res.status(404).json({ 
        error: 'No hay ventas nuevas para exportar',
        lastExport: lastExport 
      });
    }
    
    // Calcular totales
    let totalUSD = 0;
    let totalARS = 0;
    let totalVentas = sales.length;
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const isAccessory = item.product.category === 'ACCESSORY';
        if (isAccessory) {
          totalARS += item.subtotal;
        } else {
          totalUSD += item.subtotal;
        }
      });
    });
    
    // Actualizar fecha de última exportación
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { lastSalesExportAt: new Date() }
    });
    
    // Devolver datos para generar PDF en frontend
    res.json({
      success: true,
      sales,
      summary: {
        totalVentas,
        totalUSD,
        totalARS,
        periodo: {
          desde: lastExport || sales[0]?.createdAt,
          hasta: new Date()
        }
      },
      tenantName: tenant?.name || 'Mi Negocio',
      lastExport: lastExport
    });
    
  } catch (error) {
    console.error('Error exporting sales:', error);
    res.status(400).json({ error: 'Error al exportar ventas' });
  }
};
