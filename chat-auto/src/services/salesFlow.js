class SalesFlow {
  constructor(stockManager, salesManager, appointmentsManager, customersManager) {
    this.stockManager = stockManager;
    this.salesManager = salesManager;
    this.appointmentsManager = appointmentsManager;
    this.customersManager = customersManager;
  }

  async handleStockQuery(filters = {}) {
    const stock = await this.stockManager.searchStock(filters);
    return this.stockManager.formatStockForDisplay(stock);
  }

  async processSale(saleData) {
    try {
      // 1. Verificar y reservar stock
      if (saleData.productCode) {
        const reserved = await this.stockManager.reserveProduct(saleData.productCode);
        if (!reserved) {
          return {
            success: false,
            message: 'El producto ya no está disponible 😔'
          };
        }
      }

      // 2. Registrar venta
      const saleRegistered = await this.salesManager.registerSale(saleData);
      if (!saleRegistered) {
        return {
          success: false,
          message: 'Hubo un error al registrar la venta'
        };
      }

      // 3. Actualizar/crear cliente
      await this.customersManager.createOrUpdateCustomer({
        name: saleData.customerName,
        phone: saleData.customerPhone,
        lastProduct: saleData.productName,
        incrementPurchases: true
      });

      return {
        success: true,
        message: 'Venta registrada exitosamente ✅'
      };
    } catch (error) {
      console.error('Error en proceso de venta:', error);
      return {
        success: false,
        message: 'Error al procesar la venta'
      };
    }
  }

  async scheduleAppointment(appointmentData) {
    try {
      // Verificar disponibilidad
      const available = await this.appointmentsManager.isTimeAvailable(
        appointmentData.date,
        appointmentData.time
      );

      if (!available) {
        // Buscar horarios alternativos
        const alternatives = await this.appointmentsManager.findNearestAvailableTimes(
          appointmentData.date,
          appointmentData.time,
          2
        );

        return {
          success: false,
          message: 'Ese horario está ocupado',
          alternatives
        };
      }

      // Crear turno
      const created = await this.appointmentsManager.createAppointment(appointmentData);
      
      if (created) {
        return {
          success: true,
          message: `Turno confirmado para ${appointmentData.date} a las ${appointmentData.time} 👌`
        };
      }

      return {
        success: false,
        message: 'Error al agendar el turno'
      };
    } catch (error) {
      console.error('Error al agendar turno:', error);
      return {
        success: false,
        message: 'Error al procesar el turno'
      };
    }
  }

  async modifyAppointment(customerPhone, updates) {
    try {
      const updated = await this.appointmentsManager.updateAppointment(customerPhone, updates);
      
      if (updated) {
        return {
          success: true,
          message: 'Turno modificado correctamente ✅'
        };
      }

      return {
        success: false,
        message: 'No se encontró el turno'
      };
    } catch (error) {
      console.error('Error al modificar turno:', error);
      return {
        success: false,
        message: 'Error al modificar el turno'
      };
    }
  }

  async cancelAppointment(customerPhone) {
    try {
      const cancelled = await this.appointmentsManager.cancelAppointment(customerPhone);
      
      if (cancelled) {
        return {
          success: true,
          message: 'Turno cancelado correctamente'
        };
      }

      return {
        success: false,
        message: 'No se encontró el turno'
      };
    } catch (error) {
      console.error('Error al cancelar turno:', error);
      return {
        success: false,
        message: 'Error al cancelar el turno'
      };
    }
  }
}

export default SalesFlow;
