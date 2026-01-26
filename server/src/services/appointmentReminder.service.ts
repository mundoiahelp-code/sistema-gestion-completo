import { prisma } from '../lib/prisma';
import { whatsappService } from './whatsapp.service';

class AppointmentReminderService {
  private intervalId: NodeJS.Timeout | null = null;
  private checkIntervalMs = 5 * 60 * 1000; // Revisar cada 5 minutos

  start() {
    console.log('⏰ Servicio de recordatorios de turnos iniciado');
    
    // Revisar inmediatamente al iniciar
    this.checkAndSendReminders();
    
    // Luego revisar cada 5 minutos
    this.intervalId = setInterval(() => {
      this.checkAndSendReminders();
    }, this.checkIntervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏰ Servicio de recordatorios detenido');
    }
  }

  async checkAndSendReminders() {
    try {
      const now = new Date();
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const twoHoursAndFiveMin = new Date(now.getTime() + 2 * 60 * 60 * 1000 + 5 * 60 * 1000);
      
      // Buscar turnos que:
      // 1. Son para las próximas 2 horas (ventana de 5 min para no perder ninguno)
      // 2. Fueron creados hace más de 2 horas (no mandar si acaba de sacar el turno)
      // 3. Están confirmados o pendientes
      // 4. No se les ha enviado recordatorio aún
      
      const today = now.toISOString().split('T')[0];
      const targetTimeStart = twoHoursFromNow.toTimeString().slice(0, 5);
      const targetTimeEnd = twoHoursAndFiveMin.toTimeString().slice(0, 5);
      
      const appointments = await prisma.appointment.findMany({
        where: {
          date: {
            gte: new Date(today + 'T00:00:00'),
            lte: new Date(today + 'T23:59:59')
          },
          time: {
            gte: targetTimeStart,
            lte: targetTimeEnd
          },
          status: { in: ['CONFIRMED', 'PENDING'] },
          // Creado hace más de 2 horas
          createdAt: {
            lte: new Date(now.getTime() - 2 * 60 * 60 * 1000)
          }
        },
        include: {
          store: { select: { name: true, address: true } }
        }
      });

      for (const appointment of appointments) {
        // Verificar si ya se envió recordatorio (usando notes como flag)
        if (appointment.notes?.includes('[RECORDATORIO_ENVIADO]')) {
          continue;
        }

        const phone = appointment.customerPhone;
        if (!phone) continue;

        // Construir mensaje de recordatorio
        const storeName = appointment.store?.name || 'nuestra tienda';
        const storeAddress = appointment.store?.address || '';
        const productInfo = appointment.product ? `\n📱 Producto: ${appointment.product}` : '';
        
        const message = `¡Hola ${appointment.customerName}! 👋\n\n` +
          `Te recordamos que tenés un turno en *${storeName}* hoy a las *${appointment.time}hs*.\n` +
          `${storeAddress ? `📍 ${storeAddress}\n` : ''}` +
          `${productInfo}\n\n` +
          `¡Te esperamos! 🙌`;

        try {
          const sent = await whatsappService.sendMessage(phone, message);
          
          if (sent) {
            // Marcar como enviado agregando flag a notes
            const currentNotes = appointment.notes || '';
            await prisma.appointment.update({
              where: { id: appointment.id },
              data: {
                notes: currentNotes + ' [RECORDATORIO_ENVIADO]'
              }
            });
            
            console.log(`✅ Recordatorio enviado a ${appointment.customerName} (${phone}) para turno de las ${appointment.time}`);
          }
        } catch (error) {
          console.error(`❌ Error enviando recordatorio a ${phone}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error en checkAndSendReminders:', error);
    }
  }

  // Método para enviar recordatorio manual
  async sendManualReminder(appointmentId: string): Promise<boolean> {
    try {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          store: { select: { name: true, address: true } }
        }
      });

      if (!appointment || !appointment.customerPhone) {
        return false;
      }

      const storeName = appointment.store?.name || 'nuestra tienda';
      const storeAddress = appointment.store?.address || '';
      const appointmentDate = new Date(appointment.date);
      const dateStr = appointmentDate.toLocaleDateString('es-AR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
      const productInfo = appointment.product ? `\n📱 Producto: ${appointment.product}` : '';

      const message = `¡Hola ${appointment.customerName}! 👋\n\n` +
        `Te recordamos tu turno en *${storeName}*:\n\n` +
        `📅 ${dateStr}\n` +
        `🕐 ${appointment.time}hs\n` +
        `${storeAddress ? `📍 ${storeAddress}\n` : ''}` +
        `${productInfo}\n\n` +
        `¡Te esperamos! 🙌`;

      return await whatsappService.sendMessage(appointment.customerPhone, message);
    } catch (error) {
      console.error('Error enviando recordatorio manual:', error);
      return false;
    }
  }
}

export const appointmentReminderService = new AppointmentReminderService();
