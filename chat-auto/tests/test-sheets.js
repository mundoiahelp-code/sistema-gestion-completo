import SheetsClient from '../src/sheets/client.js';
import StockManager from '../src/sheets/stock.js';
import SalesManager from '../src/sheets/sales.js';
import CustomersManager from '../src/sheets/customers.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSheets() {
  console.log('🧪 Probando integración con Google Sheets...\n');

  // Inicializar cliente
  const sheets = new SheetsClient();
  await sheets.initialize();

  // Test Stock Manager
  console.log('Test 1: Leer stock');
  const stockManager = new StockManager(sheets);
  const stock = await stockManager.getStock();
  console.log(`Stock encontrado: ${stock.length} productos`);
  if (stock.length > 0) {
    console.log('Primer producto:', stock[0]);
  }
  console.log('\n---\n');

  // Test búsqueda de stock
  console.log('Test 2: Buscar productos');
  const results = await stockManager.searchStock({ modelo: 'iPhone 13' });
  console.log(`Resultados para "iPhone 13": ${results.length} productos`);
  console.log('\n---\n');

  // Test Sales Manager
  console.log('Test 3: Registrar venta de prueba');
  const salesManager = new SalesManager(sheets);
  const testSale = {
    customerName: 'Test Cliente',
    customerPhone: '5491112345678',
    productCode: 'TEST001',
    productName: 'iPhone Test',
    price: '99999',
    paymentMethod: 'Efectivo',
    status: 'Test',
    notes: 'Venta de prueba - ELIMINAR'
  };
  const saleRegistered = await salesManager.registerSale(testSale);
  console.log('Venta registrada:', saleRegistered ? '✅' : '❌');
  console.log('\n---\n');

  // Test estadísticas
  console.log('Test 4: Obtener estadísticas');
  const stats = await salesManager.getStats();
  console.log('Estadísticas del día:', stats);
  console.log('\n---\n');

  // Test Customers Manager
  console.log('Test 5: Crear/actualizar cliente');
  const customersManager = new CustomersManager(sheets);
  const customerCreated = await customersManager.createOrUpdateCustomer({
    name: 'Test Cliente',
    phone: '5491112345678',
    email: 'test@example.com',
    incrementPurchases: true,
    lastProduct: 'iPhone Test'
  });
  console.log('Cliente creado/actualizado:', customerCreated ? '✅' : '❌');
  console.log('\n---\n');

  // Test obtener cliente
  console.log('Test 6: Obtener datos de cliente');
  const customer = await customersManager.getCustomer('5491112345678');
  console.log('Cliente encontrado:', customer);
  console.log('\n---\n');

  console.log('✅ Tests completados');
  console.log('\n⚠️  IMPORTANTE: Elimina manualmente las filas de prueba de tu Google Sheet');
}

testSheets().catch(console.error);
