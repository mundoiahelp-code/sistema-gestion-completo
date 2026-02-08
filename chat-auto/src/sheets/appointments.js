import { config } from '../config/config.js';

class AppointmentsManager {
  constructor(sheetsClient) {
    this.sheets = sheetsClient;
    this.sheetName = config.sheets.sheetNames.appointments;
  }

  async getAppointments(date = null) {
    try {
      const data = await this.sheets.readRange(`${this.sheetName}!A2:G`);
      
      let appointments = data.map(row => ({
        fecha: row[0] || '',
        hora: row[1] || '',
        nombre: row[2] || '',
        telefono: row[3] || '',
        producto: row[4] || '',
        sucursal: row[5] || 'Principal',
        estado: row[6] || 'Confirmado'
      }));

      if (date) {
        appointments = appointments.filter(apt => apt.fecha === date);
      }

      return appointments.sort((a, b) => {
        if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
        return a.hora.localeCompare(b.hora);
      });
    } catch (error) {
      console.error('Error al obtener turnos:', error);
      return [];
    }
  }

  async isTimeAvailable(date, time) {
    try {
      const appointments = await this.getAppointments(date);
      return !appointments.some(apt => apt.hora === time && apt.estado !== 'Cancelado');
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      return false;
    }
  }

  async findNearestAvailableTimes(date, requestedTime, count = 2) {
    try {
      const appointments = await this.getAppointments(date);
      const occupiedTimes = appointments
        .filter(apt => apt.estado !== 'Cancelado')
        .map(apt => apt.hora);

      const [hours, minutes] = requestedTime.split(':').map(Number);
      const availableTimes = [];

      // Buscar horarios cercanos (30 min antes y después)
      for (let offset = 30; offset <= 120; offset += 30) {
        // Antes
        const beforeMinutes = hours * 60 + minutes - offset;
        if (beforeMinutes >= 0) {
          const beforeTime = `${Math.floor(beforeMinutes / 60).toString().padStart(2, '0')}:${(beforeMinutes % 60).toString().padStart(2, '0')}`;
          if (!occupiedTimes.includes(beforeTime)) {
            availableTimes.push(beforeTime);
          }
        }

        // Después
        const afterMinutes = hours * 60 + minutes + offset;
        if (afterMinutes < 24 * 60) {
          const afterTime = `${Math.floor(afterMinutes / 60).toString().padStart(2, '0')}:${(afterMinutes % 60).toString().padStart(2, '0')}`;
          if (!occupiedTimes.includes(afterTime)) {
            availableTimes.push(afterTime);
          }
        }

        if (availableTimes.length >= count) break;
      }

      return availableTimes.slice(0, count);
    } catch (error) {
      console.error('Error al buscar horarios disponibles:', error);
      return [];
    }
  }

  async createAppointment(appointmentData) {
    try {
      const row = [
        appointmentData.date,
        appointmentData.time,
        appointmentData.customerName,
        appointmentData.customerPhone,
        appointmentData.product || '',
        appointmentData.branch || 'Principal',
        'Confirmado'
      ];

      const success = await this.sheets.appendRow(this.sheetName, row);
      
      if (success) {
        console.log(`✅ Turno agendado: ${appointmentData.customerName} - ${appointmentData.date} ${appointmentData.time}`);
      }

      return success;
    } catch (error) {
      console.error('Error al crear turno:', error);
      return false;
    }
  }

  async updateAppointment(customerPhone, updates) {
    try {
      const result = await this.sheets.findRow(this.sheetName, 3, customerPhone);
      if (!result) return false;

      const row = result.data;
      
      if (updates.date) row[0] = updates.date;
      if (updates.time) row[1] = updates.time;
      if (updates.status) row[6] = updates.status;

      await this.sheets.updateRow(
        `${this.sheetName}!A${result.index + 2}:G${result.index + 2}`,
        row
      );

      return true;
    } catch (error) {
      console.error('Error al actualizar turno:', error);
      return false;
    }
  }

  async cancelAppointment(customerPhone) {
    try {
      const result = await this.sheets.findRow(this.sheetName, 3, customerPhone);
      if (!result) return false;

      await this.sheets.deleteRow(this.sheetName, result.index + 1);
      console.log(`✅ Turno cancelado: ${customerPhone}`);
      
      return true;
    } catch (error) {
      console.error('Error al cancelar turno:', error);
      return false;
    }
  }

  async getTodayAppointments() {
    const today = new Date().toLocaleDateString('es-AR');
    return await this.getAppointments(today);
  }
}

export default AppointmentsManager;
