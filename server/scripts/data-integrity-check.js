/**
 * Script para verificar integridad de datos
 * Detecta inconsistencias, datos huérfanos, etc.
 * 
 * Uso: node scripts/data-integrity-check.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDataIntegrity() {
  console.log('🔍 Verificando integridad de datos...\n');
  
  let issues = [];
  
  try {
    // 1. Ventas sin items
    const salesWithoutItems = await prisma.sale.findMany({
      where: { items: { none: {} } },
      select: { id: true, createdAt: true }
    });
    if (salesWithoutItems.length > 0) {
      issues.push(`⚠️  ${salesWithoutItems.length} ventas sin items`);
    }
    
    // 2. Productos con stock negativo
    const productsWithNegativeStock = await prisma.product.findMany({
      where: { stock: { lt: 0 } },
      select: { id: true, name: true, stock: true }
    });
    if (productsWithNegativeStock.length > 0) {
      issues.push(`⚠️  ${productsWithNegativeStock.length} productos con stock negativo`);
      productsWithNegativeStock.slice(0, 5).forEach(p => {
        console.log(`   - ${p.name}: ${p.stock}`);
      });
    }
    
    // 3. Productos con precio 0 o negativo
    const productsWithInvalidPrice = await prisma.product.findMany({
      where: { price: { lte: 0 } },
      select: { id: true, name: true, price: true }
    });
    if (productsWithInvalidPrice.length > 0) {
      issues.push(`⚠️  ${productsWithInvalidPrice.length} productos con precio inválido`);
    }
    
    // 4. Tenants sin usuarios
    const tenantsWithoutUsers = await prisma.tenant.findMany({
      where: { users: { none: {} } },
      select: { id: true, name: true, createdAt: true }
    });
    if (tenantsWithoutUsers.length > 0) {
      issues.push(`⚠️  ${tenantsWithoutUsers.length} tenants sin usuarios`);
      tenantsWithoutUsers.forEach(t => {
        console.log(`   - ${t.name} (creado: ${t.createdAt.toLocaleDateString()})`);
      });
    }
    
    // 5. Ventas con total 0
    const salesWithZeroTotal = await prisma.sale.count({
      where: { total: 0 }
    });
    if (salesWithZeroTotal > 0) {
      issues.push(`⚠️  ${salesWithZeroTotal} ventas con total $0`);
    }
    
    // 6. Productos reservados sin órdenes activas
    const reservedWithoutOrders = await prisma.product.findMany({
      where: { 
        reserved: { gt: 0 },
        orderItems: { none: { order: { status: { not: 'CANCELLED' } } } }
      },
      select: { id: true, name: true, reserved: true }
    });
    if (reservedWithoutOrders.length > 0) {
      issues.push(`⚠️  ${reservedWithoutOrders.length} productos reservados sin órdenes activas`);
    }
    
    // Resumen
    console.log('\n' + '='.repeat(60));
    if (issues.length === 0) {
      console.log('✅ No se encontraron problemas de integridad');
    } else {
      console.log('⚠️  Se encontraron los siguientes problemas:\n');
      issues.forEach(issue => console.log(issue));
      console.log('\n💡 Recomendación: Revisar y corregir estos problemas');
    }
    console.log('='.repeat(60) + '\n');
    
    // Estadísticas generales
    const [totalTenants, totalUsers, totalProducts, totalSales, totalClients] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.sale.count(),
      prisma.client.count({ where: { active: true } })
    ]);
    
    console.log('📊 Estadísticas generales:');
    console.log(`   Tenants activos: ${totalTenants}`);
    console.log(`   Usuarios: ${totalUsers}`);
    console.log(`   Productos activos: ${totalProducts}`);
    console.log(`   Ventas totales: ${totalSales}`);
    console.log(`   Clientes activos: ${totalClients}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDataIntegrity();
