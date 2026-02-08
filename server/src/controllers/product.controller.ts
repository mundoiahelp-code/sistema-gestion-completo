import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendWhatsAppNotification } from './notification.controller';
import { imeiService } from '../services/imei.service';

const productSchema = z.object({
  name: z.string().min(1),
  model: z.string().optional(),
  storage: z.string().optional(),
  color: z.string().optional(),
  imei: z.string().optional(),
  battery: z.number().int().min(0).max(100).optional(),
  price: z.number().min(0),
  cost: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  reserved: z.number().int().min(0).optional(),
  condition: z.string().optional(),
  category: z.enum(['PHONE', 'ACCESSORY']).optional(),
  description: z.string().optional(),
  warrantyDays: z.number().int().min(0).optional(),
  barcode: z.string().optional(),
  storeId: z.string().uuid(),
  active: z.boolean().optional()
});

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, search = '', storeId, category } = req.query;
    const tenantId = req.user?.tenantId;
    
    // Validar límites de paginación
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit))); // Máximo 100 registros
    
    const where: any = {
      active: true,
      tenantId, // FILTRAR POR TENANT
      OR: [
        { name: { contains: search as string, mode: 'insensitive' } },
        { model: { contains: search as string, mode: 'insensitive' } },
        { imei: { contains: search as string, mode: 'insensitive' } }
      ]
    };

    if (storeId) {
      where.storeId = storeId;
    }

    if (category) {
      where.category = category;
    }

    const products = await prisma.product.findMany({
      where,
      include: { store: { select: { id: true, name: true } } },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.product.count({ where });

    res.json({ products, total, page: pageNum, limit: limitNum });
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener productos' });
  }
};

export const getProduct = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, tenantId },
      include: { store: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ product });
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener producto' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const data = productSchema.parse(req.body);
    const tenantId = req.user!.tenantId;

    // Validar IMEI único si se proporciona
    if (data.imei) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          imei: data.imei,
          tenantId,
          active: true
        }
      });

      if (existingProduct) {
        return res.status(409).json({ 
          error: 'Ya existe un producto con ese IMEI',
          code: 'DUPLICATE_IMEI',
          field: 'imei'
        });
      }
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        tenantId,
      },
      include: { store: true }
    });

    res.status(201).json({ product });
  } catch (error) {
    console.error('Error creating product:', error);
    next(error); // Pasar al error handler
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const productId = req.params.id;
    
    // SELLER solo puede editar campos básicos (seguridad)
    if (role === 'SELLER') {
      const allowedFields = ['stock', 'reserved', 'description', 'condition', 'battery'];
      const requestedFields = Object.keys(req.body);
      const restrictedFields = requestedFields.filter(f => !allowedFields.includes(f));
      
      if (restrictedFields.length > 0) {
        return res.status(403).json({ 
          error: 'No tienes permisos para editar estos campos',
          restrictedFields,
          allowedFields,
          message: 'Los vendedores solo pueden editar: stock, reservado, descripción, condición y batería'
        });
      }
    }
    
    const data = productSchema.partial().parse(req.body);

    // Obtener producto actual para comparar precios
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!currentProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Si cambió el precio o costo, guardar en historial
    const priceChanged = data.price !== undefined && data.price !== currentProduct.price;
    const costChanged = data.cost !== undefined && data.cost !== currentProduct.cost;

    const product = await prisma.$transaction(async (tx) => {
      // Guardar historial si hubo cambio de precio
      if (priceChanged || costChanged) {
        await tx.priceHistory.create({
          data: {
            productId,
            oldPrice: currentProduct.price,
            newPrice: data.price ?? currentProduct.price,
            oldCost: currentProduct.cost,
            newCost: data.cost ?? currentProduct.cost,
            userId: req.user!.id,
            reason: req.body.priceChangeReason || null
          }
        });
      }

      // Calcular fecha de vencimiento de garantía si se especifican días
      let warrantyExpires = undefined;
      if (data.warrantyDays && data.warrantyDays > 0) {
        warrantyExpires = new Date();
        warrantyExpires.setDate(warrantyExpires.getDate() + data.warrantyDays);
      }

      // Actualizar producto
      return await tx.product.update({
        where: { id: productId },
        data: {
          ...data,
          warrantyExpires
        },
        include: { store: true }
      });
    });

    res.json({ product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ error: 'Error al actualizar producto' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { active: false }
    });

    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar producto' });
  }
};


export const transferProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { imei, productId, targetStoreId, quantity = 1 } = req.body;

    if ((!imei && !productId) || !targetStoreId) {
      return res.status(400).json({ error: 'IMEI o ID del producto y tienda destino son requeridos' });
    }

    // Buscar producto por IMEI o por ID
    let product;
    if (imei) {
      product = await prisma.product.findUnique({
        where: { imei }
      });
    } else {
      product = await prisma.product.findUnique({
        where: { id: productId }
      });
    }

    if (!product) {
      return res.status(404).json({ error: imei ? 'Producto no encontrado con ese IMEI' : 'Producto no encontrado con ese ID' });
    }

    // Verificar que la tienda destino existe
    const targetStore = await prisma.store.findUnique({
      where: { id: targetStoreId }
    });

    if (!targetStore) {
      return res.status(404).json({ error: 'Tienda destino no encontrada' });
    }

    // Si es un celular (tiene IMEI), simplemente mover
    if (product.imei || product.category === 'PHONE') {
      const updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: { storeId: targetStoreId },
        include: { store: true }
      });
      return res.json({ product: updatedProduct, message: 'Producto trasladado con éxito' });
    }

    // Si es accesorio, manejar cantidad
    const transferQty = Math.min(quantity, product.stock);
    
    if (transferQty <= 0) {
      return res.status(400).json({ error: 'No hay stock disponible para trasladar' });
    }

    if (transferQty >= product.stock) {
      // Trasladar todo el producto
      const updatedProduct = await prisma.product.update({
        where: { id: product.id },
        data: { storeId: targetStoreId },
        include: { store: true }
      });
      return res.json({ 
        product: updatedProduct, 
        message: `${transferQty} unidades trasladadas con éxito` 
      });
    }

    // Trasladar parte del stock: reducir original y crear/actualizar en destino
    const result = await prisma.$transaction(async (tx) => {
      // Reducir stock del producto original
      await tx.product.update({
        where: { id: product.id },
        data: { stock: product.stock - transferQty }
      });

      // Buscar si ya existe el mismo producto en la tienda destino
      const existingInTarget = await tx.product.findFirst({
        where: {
          name: product.name,
          storeId: targetStoreId,
          category: product.category,
          active: true
        }
      });

      if (existingInTarget) {
        // Sumar al stock existente
        const updated = await tx.product.update({
          where: { id: existingInTarget.id },
          data: { stock: existingInTarget.stock + transferQty },
          include: { store: true }
        });
        return updated;
      } else {
        // Crear nuevo producto en destino
        const newProduct = await tx.product.create({
          data: {
            name: product.name,
            model: product.model,
            price: product.price,
            cost: product.cost,
            stock: transferQty,
            category: product.category,
            description: product.description,
            storeId: targetStoreId,
            tenantId: product.tenantId,
            active: true
          },
          include: { store: true }
        });
        return newProduct;
      }
    });

    res.json({ 
      product: result, 
      message: `${transferQty} unidades trasladadas con éxito`,
      transferred: transferQty
    });
  } catch (error) {
    console.error('Error transferring product:', error);
    res.status(400).json({ error: 'Error al trasladar producto' });
  }
};


export const lookupImei = async (req: AuthRequest, res: Response) => {
  try {
    const { imei } = req.params;

    // Decodificar el IMEI por si viene codificado en la URL
    const decodedImei = decodeURIComponent(imei);

    if (!decodedImei || decodedImei.length !== 15) {
      return res.status(400).json({ error: 'IMEI debe tener 15 dígitos' });
    }

    // Primero buscar si ya existe en la base de datos local
    const existingProduct = await prisma.product.findUnique({
      where: { imei: decodedImei },
      include: { store: true }
    });

    if (existingProduct) {
      return res.json({
        found: true,
        source: 'database',
        product: {
          id: existingProduct.id,
          model: existingProduct.model,
          color: existingProduct.color,
          storage: existingProduct.storage,
          battery: existingProduct.battery,
          price: existingProduct.price,
          cost: existingProduct.cost,
          details: existingProduct.description,
          exists: true,
          productId: existingProduct.id,
          store: existingProduct.store,
          storeId: existingProduct.storeId,
          reserved: existingProduct.reserved,
          stock: existingProduct.stock,
          condition: existingProduct.condition,
          name: existingProduct.name
        }
      });
    }

    // Si no existe, buscar en servicio de IMEI (API externa + TAC database)
    const imeiInfo = await imeiService.lookup(decodedImei);

    if (imeiInfo.found) {
      return res.json({
        found: true,
        source: imeiInfo.source,
        data: {
          model: imeiInfo.model,
          color: imeiInfo.color || '',
          storage: imeiInfo.storage || '',
          exists: false
        }
      });
    }

    // Si no se encuentra, devolver vacío
    res.json({
      found: false,
      source: null,
      data: null
    });
  } catch (error) {
    console.error('Error en lookupImei:', error);
    res.status(400).json({ error: 'Error al buscar IMEI' });
  }
};

// Buscar producto por código de barras (para accesorios)
export const lookupBarcode = async (req: AuthRequest, res: Response) => {
  try {
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({ error: 'Código de barras requerido' });
    }

    // Buscar en plantillas de productos
    const template = await prisma.productTemplate.findUnique({
      where: { barcode }
    });

    if (template) {
      return res.json({
        found: true,
        source: 'template',
        data: {
          name: template.name,
          category: template.category,
          model: template.model,
          price: template.price,
          cost: template.cost,
          description: template.description
        }
      });
    }

    // Si no hay plantilla, devolver vacío
    res.json({
      found: false,
      source: null,
      data: null
    });
  } catch (error) {
    console.error('Error buscando código de barras:', error);
    res.status(400).json({ error: 'Error al buscar código de barras' });
  }
};

export const reserveProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reserved } = req.body;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { store: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Obtener información del usuario
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { name: true }
    });

    // Si no se proporciona cantidad, hacer toggle (0 o 1)
    const newReserved = reserved !== undefined ? reserved : (product.reserved > 0 ? 0 : 1);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { reserved: newReserved },
      include: { store: true }
    });

    // Registrar auditoría de reserva
    const action = updatedProduct.reserved > 0 ? 'RESERVE' : 'UNRESERVE';
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        userName: user?.name || req.user!.email,
        userRole: req.user!.role,
        tenantId: req.user!.tenantId,
        action,
        entity: 'PRODUCT',
        entityId: product.id,
        entityName: product.name || product.model || 'Producto',
        changes: JSON.stringify({
          reserved: { from: product.reserved, to: newReserved },
          store: product.store?.name
        }),
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
        userAgent: req.get('user-agent') || 'unknown'
      }
    });

    res.json({ 
      product: updatedProduct, 
      message: updatedProduct.reserved > 0 ? 'Producto reservado' : 'Reserva cancelada' 
    });
  } catch (error) {
    res.status(400).json({ error: 'Error al reservar producto' });
  }
};


// Obtener historial de precios de un producto
export const getPriceHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const history = await prisma.priceHistory.findMany({
      where: { productId: id },
      include: {
        user: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ history });
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener historial de precios' });
  }
};

// Generar código de barras/QR para un producto
export const generateBarcode = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type = 'barcode' } = req.query; // 'barcode' o 'qr'

    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Generar código único basado en ID o IMEI
    const code = product.imei || product.id.slice(-12).toUpperCase();

    // Actualizar producto con el código
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: type === 'qr' ? { qrCode: code } : { barcode: code }
    });

    res.json({ 
      product: updatedProduct,
      code,
      type
    });
  } catch (error) {
    res.status(400).json({ error: 'Error al generar código' });
  }
};


// Obtener accesorios agrupados con stock por sucursal
export const getAccessoriesGrouped = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    // Obtener todos los accesorios activos
    const accessories = await prisma.product.findMany({
      where: {
        category: 'ACCESSORY',
        active: true,
        tenantId
      },
      include: {
        store: { select: { id: true, name: true } }
      },
      orderBy: { name: 'asc' }
    });

    // Agrupar por nombre para mostrar stock por sucursal
    const grouped: { [key: string]: any } = {};

    for (const acc of accessories) {
      const key = acc.name.toLowerCase().trim();
      
      if (!grouped[key]) {
        grouped[key] = {
          id: acc.id,
          name: acc.name,
          model: acc.model,
          price: acc.price,
          cost: acc.cost,
          description: acc.description,
          category: acc.category,
          totalStock: 0,
          totalReserved: 0,
          stockByStore: [],
          products: [] // IDs de productos individuales
        };
      }

      grouped[key].totalStock += acc.stock || 0;
      grouped[key].totalReserved += acc.reserved || 0;
      grouped[key].products.push(acc.id);
      
      // Agregar info de stock por sucursal
      if (acc.store && (acc.stock || 0) > 0) {
        const existingStore = grouped[key].stockByStore.find(
          (s: any) => s.storeId === acc.store!.id
        );
        if (existingStore) {
          existingStore.stock += acc.stock || 0;
          existingStore.reserved += acc.reserved || 0;
        } else {
          grouped[key].stockByStore.push({
            storeId: acc.store.id,
            storeName: acc.store.name,
            stock: acc.stock || 0,
            reserved: acc.reserved || 0
          });
        }
      }
    }

    // Convertir a array y ordenar
    const result = Object.values(grouped).map((item: any) => ({
      ...item,
      stock: item.totalStock,
      reserved: item.totalReserved
    }));

    res.json({ accessories: result });
  } catch (error) {
    console.error('Error getting grouped accessories:', error);
    res.status(400).json({ error: 'Error al obtener accesorios' });
  }
};
