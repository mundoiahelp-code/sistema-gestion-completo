import { backendClient } from '../api/backend-client.js';

class StockAdapter {
  constructor(sheetsManager = null) {
    this.useBackend = process.env.USE_BACKEND === 'true';
    this.sheetsManager = sheetsManager;
  }

  async getStock() {
    if (this.useBackend) {
      const products = await backendClient.getProducts();
      return products.filter(p => p.stock > 0);
    } else {
      return await this.sheetsManager.getStock();
    }
  }

  async searchStock(filters = {}) {
    if (this.useBackend) {
      let products = await backendClient.getProducts();
      
      // Filtrar por modelo
      if (filters.modelo) {
        products = products.filter(p => 
          p.model?.toLowerCase().includes(filters.modelo.toLowerCase()) ||
          p.name?.toLowerCase().includes(filters.modelo.toLowerCase())
        );
      }

      // Filtrar por GB
      if (filters.gb) {
        products = products.filter(p => 
          p.storage?.includes(filters.gb)
        );
      }

      // Filtrar por color
      if (filters.color) {
        products = products.filter(p => 
          p.color?.toLowerCase().includes(filters.color.toLowerCase())
        );
      }

      // Filtrar por precio máximo
      if (filters.precioMax) {
        products = products.filter(p => 
          p.price <= parseFloat(filters.precioMax)
        );
      }

      // Solo con stock
      products = products.filter(p => p.stock > 0);

      return products;
    } else {
      return await this.sheetsManager.searchStock(filters);
    }
  }

  async reserveProduct(productIdOrCode) {
    if (this.useBackend) {
      return await backendClient.reserveProduct(productIdOrCode);
    } else {
      return await this.sheetsManager.reserveProduct(productIdOrCode);
    }
  }

  formatStockForDisplay(stock) {
    if (this.useBackend) {
      return backendClient.formatProductForDisplay(stock);
    } else {
      return this.sheetsManager.formatStockForDisplay(stock);
    }
  }
}

export default StockAdapter;
