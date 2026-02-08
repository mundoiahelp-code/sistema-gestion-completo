import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const { storeId, startDate, endDate } = req.query;
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const where: any = { tenantId }; // FILTRAR POR TENANT
    if (storeId) where.storeId = storeId;
    if (startDate || endDate) where.createdAt = dateFilter;

    const storeFilter = storeId ? { storeId: storeId as string, tenantId } : { tenantId };

    // === QUERIES PARALELAS PARA MEJOR RENDIMIENTO ===
    const [
      totalSales,
      salesData,
      productsSold,
      stockData,
      phonesStock,
      accessoriesStock,
      capitalTotal,
      capitalIphones,
      capitalAccessories,
      totalReserved
    ] = await Promise.all([
      // Total de ventas
      prisma.sale.count({ where }),
      // Ingresos totales
      prisma.sale.aggregate({ where, _sum: { total: true } }),
      // Productos vendidos
      prisma.saleItem.aggregate({ where: { sale: where }, _sum: { quantity: true } }),
      // Stock total
      prisma.product.aggregate({ where: { active: true, ...storeFilter }, _sum: { stock: true } }),
      // Stock de celulares
      prisma.product.aggregate({ where: { active: true, category: 'PHONE', ...storeFilter }, _sum: { stock: true } }),
      // Stock de accesorios
      prisma.product.aggregate({ where: { active: true, category: 'ACCESSORY', ...storeFilter }, _sum: { stock: true } }),
      // Capital total
      prisma.product.aggregate({ where: { active: true, stock: { gt: 0 }, ...storeFilter }, _sum: { price: true } }),
      // Capital iPhones
      prisma.product.aggregate({ where: { active: true, category: 'PHONE', stock: { gt: 0 }, ...storeFilter }, _sum: { price: true } }),
      // Capital Accesorios
      prisma.product.aggregate({ where: { active: true, category: 'ACCESSORY', stock: { gt: 0 }, ...storeFilter }, _sum: { price: true } }),
      // Total reservados
      prisma.product.aggregate({ where: { active: true, reserved: { gt: 0 }, ...storeFilter }, _sum: { reserved: true } })
    ]);

    // === FECHAS PARA QUERIES ===
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    
    // Inicio del día (hoy a las 00:00)
    const startOfDay = new Date(currentYear, currentMonth, now.getDate(), 0, 0, 0);
    
    // Inicio de la semana (lunes)
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(currentYear, currentMonth, now.getDate() - diffToMonday, 0, 0, 0);

    // === SEGUNDA TANDA DE QUERIES PARALELAS ===
    const [
      allSales,
      lastSales,
      totalOrders,
      lastOrders,
      salesThisMonth,
      topProducts,
      // Ventas por período (día, semana, mes)
      salesToday,
      salesWeek,
      salesMonth
    ] = await Promise.all([
      // Ventas últimos 12 meses
      prisma.sale.findMany({
        where: { ...where, createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true, total: true }
      }),
      // Últimas 5 ventas (FILTRADO POR TENANT)
      prisma.sale.findMany({
        where: storeFilter,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, name: true } },
          user: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true, model: true } } } }
        }
      }),
      // Total orders (FILTRADO POR TENANT)
      prisma.order.count({ where: { tenantId } }),
      // Últimas 5 orders (FILTRADO POR TENANT)
      prisma.order.findMany({
        where: { tenantId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true, model: true } } } }
        }
      }),
      // Ventas del mes (para earnings y profit)
      prisma.saleItem.findMany({
        where: { sale: { createdAt: { gte: startOfMonth }, ...storeFilter } },
        include: { product: { select: { category: true, cost: true } } }
      }),
      // Top productos
      prisma.saleItem.groupBy({
        by: ['productId'],
        where: { sale: where },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      }),
      // Ventas de HOY
      prisma.sale.aggregate({
        where: { createdAt: { gte: startOfDay }, ...storeFilter },
        _sum: { total: true },
        _count: true
      }),
      // Ventas de la SEMANA
      prisma.sale.aggregate({
        where: { createdAt: { gte: startOfWeek }, ...storeFilter },
        _sum: { total: true },
        _count: true
      }),
      // Ventas del MES
      prisma.sale.aggregate({
        where: { createdAt: { gte: startOfMonth }, ...storeFilter },
        _sum: { total: true },
        _count: true
      })
    ]);

    // Procesar ventas por mes
    const salesByMonthMap = new Map<string, { total: number; count: number }>();
    allSales.forEach(sale => {
      const date = new Date(sale.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = salesByMonthMap.get(key) || { total: 0, count: 0 };
      salesByMonthMap.set(key, {
        total: existing.total + Number(sale.total),
        count: existing.count + 1
      });
    });

    // Generar últimos 12 meses (aunque no tengan ventas)
    const salesByMonth = [];
    const currentDate = new Date();
    
    // Empezar desde hace 11 meses hasta el mes actual (12 meses en total)
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;
      const data = salesByMonthMap.get(key) || { total: 0, count: 0 };
      
      salesByMonth.push({
        month: key, // Formato "2024-01" para que el frontend lo procese
        total: data.total,
        count: data.count
      });
    }
    
    console.log('📊 Meses generados:', salesByMonth.map(m => `${m.month}: ${m.count} ventas`).join(', '));

    // Calcular earnings y profit
    let earningsUSD = 0;
    let earningsARS = 0;
    let profitUSD = 0;
    let profitARS = 0;
    let totalCost = 0;
    
    salesThisMonth.forEach(item => {
      const revenue = item.price * item.quantity;
      const cost = (item.product?.cost || 0) * item.quantity;
      const profit = revenue - cost;
      
      totalCost += cost;
      
      if (item.product?.category === 'PHONE') {
        earningsUSD += revenue;
        profitUSD += profit;
      } else {
        earningsARS += revenue;
        profitARS += profit;
      }
    });

    const totalProfit = profitUSD + profitARS;
    const totalRevenue = earningsUSD + earningsARS;

    // Top productos con detalles (batch query en lugar de N+1)
    const productIds = topProducts.map(p => p.productId);
    const productsDetails = productIds.length > 0 
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, model: true }
        })
      : [];
    const productsMap = new Map(productsDetails.map(p => [p.id, p]));
    
    const topProductsWithDetails = topProducts.map(item => ({
      ...productsMap.get(item.productId),
      quantitySold: item._sum.quantity,
      revenue: item._sum.subtotal
    }));

    // Resumen de ventas por período
    const salesSummary = {
      today: {
        count: salesToday._count || 0,
        total: salesToday._sum.total || 0
      },
      week: {
        count: salesWeek._count || 0,
        total: salesWeek._sum.total || 0
      },
      month: {
        count: salesMonth._count || 0,
        total: salesMonth._sum.total || 0
      }
    };

    // SEGURIDAD: Filtrar datos sensibles según rol
    // SELLER no debe ver costos, ganancias ni capital
    if (userRole === 'SELLER') {
      return res.json({
        totalSales,
        productsSold: productsSold._sum.quantity || 0,
        totalStock: stockData._sum.stock || 0,
        phonesStock: phonesStock._sum.stock || 0,
        accessoriesStock: accessoriesStock._sum.stock || 0,
        totalReserved: totalReserved._sum.reserved || 0,
        salesByMonth: salesByMonth.map(m => ({ month: m.month, count: m.count })), // Sin totales
        lastSales: lastSales.map(sale => ({
          id: sale.id,
          client: sale.client,
          user: sale.user,
          itemsCount: sale.items.length,
          createdAt: sale.createdAt
          // NO enviar total
        })),
        lastOrders: lastOrders.map((order, index) => ({
          id: order.id,
          code: String(totalOrders - index).padStart(3, '0'),
          totalItems: order.items.reduce((acc, item) => acc + item.quantity, 0),
          vendor: order.user?.name || 'Sin vendedor',
          notes: order.notes,
          createdAt: order.createdAt
        })),
        topProducts: topProductsWithDetails.map(p => ({
          id: p.id,
          name: p.name,
          model: p.model,
          quantitySold: p.quantitySold
          // NO enviar revenue
        })),
        salesSummary: {
          today: { count: salesSummary.today.count },
          week: { count: salesSummary.week.count },
          month: { count: salesSummary.month.count }
          // NO enviar totales
        }
      });
    }

    // ADMIN y MANAGER ven datos completos
    res.json({
      totalSales,
      totalRevenue: salesData._sum.total || 0,
      totalProfit, // Ganancia real del mes
      totalCost, // Costo total del mes
      profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0,
      productsSold: productsSold._sum.quantity || 0,
      totalStock: stockData._sum.stock || 0,
      phonesStock: phonesStock._sum.stock || 0,
      accessoriesStock: accessoriesStock._sum.stock || 0,
      capitalTotal: capitalTotal._sum.price || 0,
      capitalIphones: capitalIphones._sum.price || 0,
      capitalAccessories: capitalAccessories._sum.price || 0,
      earningsUSD,
      earningsARS,
      profitUSD, // Ganancia en USD
      profitARS, // Ganancia en ARS
      totalReserved: totalReserved._sum.reserved || 0,
      salesByMonth,
      lastSales: lastSales.map(sale => ({
        id: sale.id,
        total: sale.total,
        client: sale.client,
        user: sale.user,
        itemsCount: sale.items.length,
        createdAt: sale.createdAt
      })),
      lastOrders: lastOrders.map((order, index) => ({
        id: order.id,
        code: String(totalOrders - index).padStart(3, '0'),
        totalItems: order.items.reduce((acc, item) => acc + item.quantity, 0),
        vendor: order.user?.name || 'Sin vendedor',
        notes: order.notes,
        createdAt: order.createdAt
      })),
      topProducts: topProductsWithDetails,
      salesSummary
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      error: 'Error al obtener estadísticas',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};
