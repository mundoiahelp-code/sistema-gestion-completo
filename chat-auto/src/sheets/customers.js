import { config } from '../config/config.js';

class CustomersManager {
  constructor(sheetsClient) {
    this.sheets = sheetsClient;
    this.sheetName = config.sheets.sheetNames.customers;
  }

  async getCustomer(phone) {
    try {
      const result = await this.sheets.findRow(this.sheetName, 1, phone);
      if (!result) return null;

      return {
        name: result.data[0] || '',
        phone: result.data[1] || '',
        email: result.data[2] || '',
        firstContact: result.data[3] || '',
        lastContact: result.data[4] || '',
        previousPurchases: parseInt(result.data[5]) || 0,
        lastProduct: result.data[6] || '',
        notes: result.data[7] || ''
      };
    } catch (error) {
      console.error('Error al obtener cliente:', error);
      return null;
    }
  }

  async createOrUpdateCustomer(customerData) {
    try {
      const existing = await this.sheets.findRow(this.sheetName, 1, customerData.phone);
      const timestamp = new Date().toLocaleString('es-AR');

      if (existing) {
        // Actualizar cliente existente
        const row = existing.data;
        row[0] = customerData.name || row[0];
        row[2] = customerData.email || row[2];
        row[4] = timestamp; // Último contacto
        row[5] = (parseInt(row[5]) || 0) + (customerData.incrementPurchases ? 1 : 0);
        row[6] = customerData.lastProduct || row[6];
        row[7] = customerData.notes || row[7];

        await this.sheets.updateRow(
          `${this.sheetName}!A${existing.index + 2}:H${existing.index + 2}`,
          row
        );
      } else {
        // Crear nuevo cliente
        const row = [
          customerData.name || '',
          customerData.phone,
          customerData.email || '',
          timestamp, // Primer contacto
          timestamp, // Último contacto
          customerData.incrementPurchases ? '1' : '0',
          customerData.lastProduct || '',
          customerData.notes || ''
        ];

        await this.sheets.appendRow(this.sheetName, row);
      }

      return true;
    } catch (error) {
      console.error('Error al crear/actualizar cliente:', error);
      return false;
    }
  }

  async getAllCustomers() {
    try {
      const data = await this.sheets.readRange(`${this.sheetName}!A2:H`);
      
      return data.map(row => ({
        name: row[0] || '',
        phone: row[1] || '',
        email: row[2] || '',
        firstContact: row[3] || '',
        lastContact: row[4] || '',
        previousPurchases: parseInt(row[5]) || 0,
        lastProduct: row[6] || '',
        notes: row[7] || ''
      }));
    } catch (error) {
      console.error('Error al obtener todos los clientes:', error);
      return [];
    }
  }
}

export default CustomersManager;
