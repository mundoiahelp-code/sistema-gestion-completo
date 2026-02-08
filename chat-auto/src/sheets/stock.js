import { config } from '../config/config.js';

class StockManager {
  constructor(sheetsClient) {
    this.sheets = sheetsClient;
    this.sheetName = config.sheets.sheetNames.stock;
  }

  async getStock() {
    try {
      const data = await this.sheets.readRange(`${this.sheetName}!A2:J`);
      
      return data.map(row => ({
        codigo: row[0] || '',
        modelo: row[1] || '',
        gb: row[2] || '',
        color: row[3] || '',
        bateria: row[4] || '',
        estado: row[5] || '',
        precio: row[6] || '',
        stock: row[7] || '1',
        sucursal: row[8] || 'Principal',
        notas: row[9] || ''
      }));
    } catch (error) {
      console.error('Error al obtener stock:', error);
      return [];
    }
  }

  async searchStock(filters = {}) {
    try {
      let stock = await this.getStock();

      // Filtrar por modelo
      if (filters.modelo) {
        stock = stock.filter(item => 
          item.modelo.toLowerCase().includes(filters.modelo.toLowerCase())
        );
      }

      // Filtrar por GB
      if (filters.gb) {
        stock = stock.filter(item => item.gb === filters.gb);
      }

      // Filtrar por color
      if (filters.color) {
        stock = stock.filter(item => 
          item.color.toLowerCase().includes(filters.color.toLowerCase())
        );
      }

      // Filtrar por presupuesto máximo
      if (filters.precioMax) {
        stock = stock.filter(item => {
          const precio = parseFloat(item.precio.replace(/[^0-9.-]+/g, ''));
          return precio <= parseFloat(filters.precioMax);
        });
      }

      // Solo items con stock disponible
      stock = stock.filter(item => parseInt(item.stock) > 0);

      return stock;
    } catch (error) {
      console.error('Error al buscar en stock:', error);
      return [];
    }
  }

  async updateStock(codigo, newStock) {
    try {
      const result = await this.sheets.findRow(this.sheetName, 0, codigo);
      if (!result) return false;

      const row = result.data;
      row[7] = newStock.toString();

      await this.sheets.updateRow(
        `${this.sheetName}!A${result.index + 2}:J${result.index + 2}`,
        row
      );

      return true;
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      return false;
    }
  }

  async reserveProduct(codigo) {
    try {
      const result = await this.sheets.findRow(this.sheetName, 0, codigo);
      if (!result) return false;

      const currentStock = parseInt(result.data[7]);
      if (currentStock <= 0) return false;

      return await this.updateStock(codigo, currentStock - 1);
    } catch (error) {
      console.error('Error al reservar producto:', error);
      return false;
    }
  }

  formatStockForDisplay(stock) {
    if (!stock || stock.length === 0) {
      return 'No hay stock disponible en este momento 😔';
    }

    let message = '📱 *Stock disponible:*\n\n';
    
    stock.forEach((item, index) => {
      message += `${index + 1}. ${item.modelo} ${item.gb}GB ${item.color}\n`;
      message += `   💚 Batería: ${item.bateria}%\n`;
      message += `   ✨ Estado: ${item.estado}\n`;
      message += `   💰 Precio: $${item.precio}\n`;
      if (item.notas) {
        message += `   📝 ${item.notas}\n`;
      }
      message += `\n`;
    });

    return message.trim();
  }
}

export default StockManager;
