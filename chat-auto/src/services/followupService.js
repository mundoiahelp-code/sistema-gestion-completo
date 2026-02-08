import { config } from '../config/config.js';

class FollowupService {
  constructor(sheetsClient, whatsappClient) {
    this.sheets = sheetsClient;
    this.whatsapp = whatsappClient;
    this.sheetName = config.sheets.sheetNames.followups;
  }

  async scheduleFollowup(customerPhone, customerName, productInterest) {
    try {
      const followupDate = new Date();
      followupDate.setHours(followupDate.getHours() + config.followup.delayHours);

      const row = [
        new Date().toLocaleString('es-AR'),
        customerPhone,
        customerName,
        productInterest,
        followupDate.toLocaleString('es-AR'),
        'Pendiente'
      ];

      await this.sheets.appendRow(this.sheetName, row);
      console.log(`📅 Seguimiento programado para ${customerName} en ${config.followup.delayHours}h`);
      
      return true;
    } catch (error) {
      console.error('Error al programar seguimiento:', error);
      return false;
    }
  }

  async getPendingFollowups() {
    try {
      const data = await this.sheets.readRange(`${this.sheetName}!A2:F`);
      const now = new Date();

      return data
        .filter(row => {
          const followupDate = new Date(row[4]);
          return row[5] === 'Pendiente' && followupDate <= now;
        })
        .map(row => ({
          phone: row[1],
          name: row[2],
          product: row[3],
          scheduledDate: row[4]
        }));
    } catch (error) {
      console.error('Error al obtener seguimientos pendientes:', error);
      return [];
    }
  }

  async sendFollowup(customerPhone, customerName, productInterest) {
    try {
      const messages = [
        `Hola ${customerName}! Como va? Te acordás que habías consultado por ${productInterest}`,
        `Quería saber si te sigue interesando o si buscabas otra cosa 😊`,
        `Cualquier cosa avisame y lo vemos!`
      ];

      for (const message of messages) {
        await this.whatsapp.sendMessage(customerPhone, message);
        await this.delay(1000);
      }

      await this.markFollowupAsSent(customerPhone);
      
      return true;
    } catch (error) {
      console.error('Error al enviar seguimiento:', error);
      return false;
    }
  }

  async markFollowupAsSent(customerPhone) {
    try {
      const result = await this.sheets.findRow(this.sheetName, 1, customerPhone);
      if (!result) return false;

      const row = result.data;
      row[5] = 'Enviado';

      await this.sheets.updateRow(
        `${this.sheetName}!A${result.index + 2}:F${result.index + 2}`,
        row
      );

      return true;
    } catch (error) {
      console.error('Error al marcar seguimiento como enviado:', error);
      return false;
    }
  }

  async processFollowups() {
    if (!config.followup.enabled) return;

    try {
      const pending = await this.getPendingFollowups();
      
      for (const followup of pending) {
        await this.sendFollowup(followup.phone, followup.name, followup.product);
        await this.delay(5000); // 5 segundos entre seguimientos
      }

      if (pending.length > 0) {
        console.log(`✅ Procesados ${pending.length} seguimientos`);
      }
    } catch (error) {
      console.error('Error al procesar seguimientos:', error);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  startAutoFollowup() {
    // Ejecutar cada hora
    setInterval(() => {
      this.processFollowups();
    }, 60 * 60 * 1000);

    console.log('🔄 Servicio de seguimiento automático iniciado');
  }
}

export default FollowupService;
