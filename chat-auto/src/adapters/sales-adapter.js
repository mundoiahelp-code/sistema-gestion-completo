import { backendClient } from '../api/backend-client.js';

class SalesAdapter {
  constructor(sheetsManager = null) {
    this.useBackend = process.env.USE_BACKEND === 'true';
    this.sheetsManager = sheetsManager;
  }

  async registerSale(saleData) {
    if (this.useBackend) {
      try {
        // Buscar o crear cliente
        const client = await backendClient.findOrCreateClient({
          name: saleData.customerName,
          phone: saleData.customerPhone,
        });

        // Crear venta
        await backendClient.createSale({
          clientId: client.id,
          storeId: saleData.storeId,
          items: [{
            productId: saleData.productId,
            quantity: 1,
            price: parseFloat(saleData.price),
          }],
          total: parseFloat(saleData.price),
          paymentMethod: saleData.paymentMethod || 'CASH',
          notes: saleData.notes,
        });

        return true;
      } catch (error) {
        console.error('Error registrando venta en backend:', error);
        return false;
      }
    } else {
      return await this.sheetsManager.registerSale(saleData);
    }
  }

  async getSalesToday() {
    if (this.useBackend) {
      const today = new Date().toISOString().split('T')[0];
      return await backendClient.getSales({ date: today });
    } else {
      return await this.sheetsManager.getSalesToday();
    }
  }

  async getStats() {
    if (this.useBackend) {
      return await backendClient.getDashboardStats();
    } else {
      return await this.sheetsManager.getStats();
    }
  }
}

export default SalesAdapter;
