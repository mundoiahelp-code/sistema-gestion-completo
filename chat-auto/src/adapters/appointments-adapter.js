import { config } from '../config/config.js';
import { backendClient } from '../api/backend-client.js';

// Adaptador que usa backend o Google Sheets según configuración
class AppointmentsAdapter {
  constructor(sheetsManager = null) {
    this.useBackend = process.env.USE_BACKEND === 'true';
    this.sheetsManager = sheetsManager;
    
    if (this.useBackend) {
      console.log('✅ Usando Backend API para turnos');
    } else {
      console.log('✅ Usando Google Sheets para turnos');
    }
  }

  async getAppointments(date = null) {
    if (this.useBackend) {
      return await backendClient.getAppointments(date);
    } else {
      return await this.sheetsManager.getAppointments(date);
    }
  }

  async isTimeAvailable(date, time) {
    if (this.useBackend) {
      return await backendClient.checkAvailability(date, time);
    } else {
      return await this.sheetsManager.isTimeAvailable(date, time);
    }
  }

  async createAppointment(appointmentData) {
    if (this.useBackend) {
      try {
        await backendClient.createAppointment(appointmentData);
        return true;
      } catch (error) {
        console.error('Error creando turno en backend:', error);
        return false;
      }
    } else {
      return await this.sheetsManager.createAppointment(appointmentData);
    }
  }

  async cancelAppointment(customerPhone) {
    if (this.useBackend) {
      return await backendClient.cancelAppointment(customerPhone);
    } else {
      return await this.sheetsManager.cancelAppointment(customerPhone);
    }
  }

  async getTodayAppointments() {
    const today = new Date().toISOString().split('T')[0];
    return await this.getAppointments(today);
  }
}

export default AppointmentsAdapter;
