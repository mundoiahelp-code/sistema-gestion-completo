import { prisma } from './prisma';
import { NotFoundError, ValidationError, InsufficientStockError } from './errors';

/**
 * Validar que las referencias existan y pertenezcan al tenant correcto
 */
export const validateReferences = async (data: {
  clientId?: string;
  storeId?: string;
  productId?: string;
  userId?: string;
  tenantId: string;
}) => {
  if (data.clientId) {
    const client = await prisma.client.findFirst({
      where: { id: data.clientId, tenantId: data.tenantId, active: true }
    });
    if (!client) {
      throw new NotFoundError('Cliente', data.clientId);
    }
  }
  
  if (data.storeId) {
    const store = await prisma.store.findFirst({
      where: { id: data.storeId, tenantId: data.tenantId, active: true }
    });
    if (!store) {
      throw new NotFoundError('Sucursal', data.storeId);
    }
  }
  
  if (data.productId) {
    const product = await prisma.product.findFirst({
      where: { id: data.productId, tenantId: data.tenantId, active: true }
    });
    if (!product) {
      throw new NotFoundError('Producto', data.productId);
    }
  }

  if (data.userId) {
    const user = await prisma.user.findFirst({
      where: { id: data.userId, tenantId: data.tenantId, active: true }
    });
    if (!user) {
      throw new NotFoundError('Usuario', data.userId);
    }
  }
};

/**
 * Validar stock disponible para una venta
 */
export const validateStock = async (items: Array<{ productId: string; quantity: number }>, tenantId: string) => {
  for (const item of items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, tenantId },
      select: { 
        id: true, 
        name: true, 
        model: true, 
        stock: true, 
        reserved: true,
        active: true
      }
    });
    
    if (!product) {
      throw new NotFoundError('Producto', item.productId);
    }

    if (!product.active) {
      throw new ValidationError(`El producto ${product.name || product.model} no está disponible`);
    }
    
    const availableStock = product.stock - product.reserved;
    if (availableStock < item.quantity) {
      throw new InsufficientStockError(
        product.name || product.model || 'Producto',
        availableStock,
        item.quantity
      );
    }
  }
};

/**
 * Validar lógica de negocio de una venta
 */
export const validateSaleLogic = (data: {
  total: number;
  discount?: number;
  items: Array<{ quantity: number; price: number }>;
}) => {
  // Validar que el total sea positivo
  if (data.total <= 0) {
    throw new ValidationError('El total de la venta debe ser mayor a 0');
  }

  // Validar que el descuento no sea mayor al total
  if (data.discount && data.discount > data.total) {
    throw new ValidationError('El descuento no puede ser mayor al total');
  }

  // Validar que haya items
  if (!data.items || data.items.length === 0) {
    throw new ValidationError('La venta debe tener al menos un producto');
  }

  // Validar que las cantidades sean positivas
  for (const item of data.items) {
    if (item.quantity <= 0) {
      throw new ValidationError('La cantidad debe ser mayor a 0');
    }
    if (item.price < 0) {
      throw new ValidationError('El precio no puede ser negativo');
    }
  }

  // Validar que el total calculado coincida (con margen de error por redondeo)
  const calculatedTotal = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const totalWithDiscount = calculatedTotal - (data.discount || 0);
  const difference = Math.abs(totalWithDiscount - data.total);
  
  if (difference > 1) { // Margen de 1 peso por redondeo
    throw new ValidationError('El total no coincide con la suma de los items', {
      expected: totalWithDiscount,
      received: data.total,
      difference
    });
  }
};

/**
 * Validar formato de IMEI
 */
export const validateIMEI = (imei: string): boolean => {
  // IMEI debe tener 15 dígitos
  if (!/^\d{15}$/.test(imei)) {
    throw new ValidationError('IMEI debe tener exactamente 15 dígitos');
  }
  
  // Validar checksum (algoritmo de Luhn)
  const digits = imei.split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < 15; i++) {
    let digit = digits[i];
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  
  if (sum % 10 !== 0) {
    throw new ValidationError('IMEI inválido (checksum incorrecto)');
  }
  
  return true;
};

/**
 * Validar que un producto pueda ser transferido
 */
export const validateTransfer = async (
  productId: string,
  targetStoreId: string,
  quantity: number,
  tenantId: string
) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId },
    include: { store: true }
  });

  if (!product) {
    throw new NotFoundError('Producto', productId);
  }

  if (!product.active) {
    throw new ValidationError('No se puede transferir un producto inactivo');
  }

  const targetStore = await prisma.store.findFirst({
    where: { id: targetStoreId, tenantId, active: true }
  });

  if (!targetStore) {
    throw new NotFoundError('Sucursal destino', targetStoreId);
  }

  if (product.storeId === targetStoreId) {
    throw new ValidationError('El producto ya está en esa sucursal');
  }

  const availableStock = product.stock - product.reserved;
  if (availableStock < quantity) {
    throw new InsufficientStockError(
      product.name || product.model || 'Producto',
      availableStock,
      quantity
    );
  }

  return { product, targetStore };
};
