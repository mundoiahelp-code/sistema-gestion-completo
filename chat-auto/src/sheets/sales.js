import { config } from '../config/config.js';

class SalesManager {
  constructor(sheetsClient) {
    this.sheets = sheetsClient;
    this.sheetName = config.sheets.sheetNames.sales;
  }

  async registerSale(saleData) {
    try {
      const timestamp = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
      
      const row = [
        timestamp,                          // Fecha y hora
        saleData.customerName || '',        // Nombre cliente
        saleData.customerPhone || '',       // Teléfono
        saleData.productCode || '',         // Código producto
        saleData.productName || '',         // Producto
        saleData.price || '',               // Precio
        saleData.paymentMethod || '',       // Método de pago
        saleData.status || 'Pendiente',     // Estado
        saleData.appointmentDate || '',     // Fecha turno
        saleData.notes || ''                // Notas
      ];

      const success = await this.sheets.appendRow(this.sheetName, row);
      
      if (success) {
        console.log(`✅ Venta registrada: ${saleData.productName} - ${saleData.customerName}`);
      }

      return success;
    } catch (error) {
      console.error('Error al registrar venta:', error);
      return false;
    }
  }

  async updateSaleStatus(customerPhone, newStatus) {
    try {
      const result = await this.sheets.findRow(this.sheetName, 2, customerPhone);
      if (!result) return false;

      const row = result.data;
      row[7] = newStatus;

      await this.sheets.updateRow(
        `${this.sheetName}!A${result.index + 2}:J${result.index + 2}`,
        row
      );

      return true;
    } catch (error) {
      console.error('Error al actualizar estado de venta:', error);
      return false;
    }
  }

  async getSalesToday() {
    try {
      const data = await this.sheets.readRange(`${this.sheetName}!A2:J`);
      const today = new Date().toLocaleDateString('es-AR');

      return data.filter(row => {
        const saleDate = row[0] ? row[0].split(',')[0] : '';
        return saleDate === today;
      });
    } catch (error) {
      console.error('Error al obtener ventas del día:', error);
      return [];
    }
  }

  async getStats() {
    try {
      const salesToday = await this.getSalesToday();
      
      const totalSales = salesToday.length;
      const totalRevenue = salesToday.reduce((sum, row) => {
        const price = parseFloat(row[5]?.replace(/[^0-9.-]+/g, '') || 0);
        return sum + price;
      }, 0);

      const pendingSales = salesToday.filter(row => row[7] === 'Pendiente').length;
      const completedSales = salesToday.filter(row => row[7] === 'Completada').length;

      return {
        totalSales,
        totalRevenue,
        pendingSales,
        completedSales
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return null;
    }
  }
}

export default SalesManager;
