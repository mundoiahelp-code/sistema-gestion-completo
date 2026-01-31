class MessageHandler {
  constructor(
    anthropicClient,
    conversationManager,
    salesFlow,
    customersManager,
    stockManager,
    followupService,
    backendIntegration = null,
    mercadoPago = null
  ) {
    this.ai = anthropicClient;
    this.conversations = conversationManager;
    this.salesFlow = salesFlow;
    this.customers = customersManager;
    this.stock = stockManager;
    this.followup = followupService;
    this.backend = backendIntegration;
    this.mp = mercadoPago;
  }

  async handleMessage(phoneNumber, messageText, whatsappClient, customerName = null) {
    try {
      console.log(`📩 [${phoneNumber}] ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`);

      if (messageText.startsWith('!')) {
        return await this.handleAdminCommand(messageText, phoneNumber, whatsappClient);
      }

      // IMPORTANTE: Siempre guardar el mensaje en el backend primero
      if (this.backend) {
        try {
          console.log('💾 Guardando mensaje en backend...');
          await this.backend.logChatMessage(phoneNumber, messageText, '', 'RECIBIDO', 'pending', customerName);
          console.log('✅ Mensaje guardado en CRM');
        } catch (error) {
          console.error('❌ Error guardando en CRM:', error.message);
          if (error.response) {
            console.error('Respuesta del servidor:', error.response.status, error.response.data);
          }
        }
      }

      // Verificar si el bot debe responder automáticamente
      if (this.backend) {
        console.log('🔍 Verificando estado del bot...');
        const botActive = await this.backend.isBotActive();
        console.log(`🤖 Estado del bot: ${botActive ? 'ACTIVO' : 'INACTIVO'}`);
        
        if (!botActive) {
          console.log('🤖 Bot inactivo - mensaje guardado, sin respuesta automática');
          return;
        }

        // Si llegamos aquí, el bot está activo y debe responder
        console.log('🤖 Bot activo - generando respuesta...');

        const isWithinHours = await this.backend.isWithinWorkingHours();
        if (!isWithinHours) {
          const response = 'buenas, estoy fuera del horario de atencion, te respondo mañana a primera hora';
          await whatsappClient.sendMessage(phoneNumber, response);
          await this.backend.logChatMessage(phoneNumber, messageText, response, 'FUERA_HORARIO', 'responded');
          return;
        }

        const isAllowed = await this.backend.checkRateLimit(phoneNumber);
        if (!isAllowed) {
          console.log('⚠️ Rate limit excedido para', phoneNumber);
          return;
        }
      }

      const conversation = this.conversations.getConversation(phoneNumber);
      this.conversations.addMessage(phoneNumber, 'user', messageText);

      let customerData = null;
      try {
        if (this.customers && typeof this.customers.getCustomer === 'function') {
          customerData = await this.customers.getCustomer(phoneNumber);
        } else if (this.customers && typeof this.customers.findOrCreate === 'function') {
          customerData = await this.customers.findOrCreate({ phone: phoneNumber });
        }
      } catch (e) {
        console.log('No se pudo obtener datos del cliente:', e.message);
      }

      const currentState = conversation.state;
      
      if (currentState === 'SCHEDULING_APPOINTMENT') {
        console.log('📅 Continuando flujo de turno...');
        const response = await this.handleAppointmentRequest(phoneNumber, messageText);
        await whatsappClient.sendMessage(phoneNumber, response);
        this.conversations.addMessage(phoneNumber, 'assistant', response);
        if (this.backend) {
          await this.backend.logChatMessage(phoneNumber, messageText, response, 'PIDE_TURNO', 'responded');
        }
        return;
      }

      const intent = await this.ai.analyzeIntent(messageText);
      console.log(`🎯 Intención: ${intent}`);

      let response;
      
      switch (intent) {
        case 'CONSULTA_STOCK':
          response = await this.handleStockQuery(phoneNumber, messageText, customerData);
          break;
        case 'CONSULTA_PRECIO':
          response = await this.handlePriceQuery(phoneNumber, messageText, customerData);
          break;
        case 'QUIERE_COMPRAR':
          response = await this.handlePurchaseIntent(phoneNumber, messageText, customerData);
          break;
        case 'PIDE_FINANCIACION':
          response = await this.handleFinancingQuery(phoneNumber, messageText);
          break;
        case 'PIDE_LINK_PAGO':
          response = await this.handlePaymentLinkRequest(phoneNumber, messageText);
          break;
        case 'PIDE_ALIAS':
        case 'PIDE_CVU':
        case 'PIDE_DATOS_TRANSFERENCIA':
          response = await this.handleTransferDataRequest(phoneNumber);
          break;
        case 'CONFIRMA_PAGO':
        case 'YA_PAGUE':
        case 'YA_TRANSFERI':
          response = await this.handlePaymentConfirmation(phoneNumber, messageText);
          break;
        case 'PIDE_TURNO':
          response = await this.handleAppointmentRequest(phoneNumber, messageText);
          break;
        case 'MODIFICA_TURNO':
          response = await this.handleAppointmentModification(phoneNumber, messageText);
          break;
        case 'CANCELA_TURNO':
          response = await this.handleAppointmentCancellation(phoneNumber);
          break;
        case 'CONSULTA_TURNO':
          response = await this.handleAppointmentQuery(phoneNumber);
          break;
        case 'PIDE_REEMBOLSO':
          response = await this.handleRefundRequest(phoneNumber, messageText);
          break;
        case 'PIDE_CAMBIO':
          response = await this.handleExchangeRequest(phoneNumber, messageText);
          break;
        case 'PRODUCTO_DEFECTUOSO':
          response = await this.handleDefectiveProduct(phoneNumber, messageText);
          break;
        case 'RECLAMO':
        case 'MALA_ATENCION':
        case 'PRODUCTO_MAL_ESTADO':
          response = await this.handleComplaint(phoneNumber, messageText, intent);
          break;
        case 'AYUDA_TECNICA':
        case 'CONFIGURACION':
          response = await this.handleTechnicalSupport(phoneNumber, messageText);
          break;
        case 'GARANTIA':
          response = await this.handleWarrantyQuery(phoneNumber, messageText);
          break;
        case 'CONSULTA_HORARIOS':
          response = await this.handleScheduleQuery(phoneNumber);
          break;
        case 'CONSULTA_ENVIOS':
          response = await this.handleShippingQuery(phoneNumber, messageText);
          break;
        default:
          response = await this.handleGeneralConversation(phoneNumber, messageText, customerData);
      }

      if (this.backend) {
        const delay = await this.backend.getResponseDelay();
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      await whatsappClient.sendMessage(phoneNumber, response);
      this.conversations.addMessage(phoneNumber, 'assistant', response);

      if (this.backend) {
        try {
          await this.backend.logChatMessage(phoneNumber, messageText, response, intent, 'responded');
          console.log('✅ Guardado en backend');
        } catch (error) {
          console.error('❌ Error guardando en backend:', error.message);
        }
      }

      if (customerData && this.customers && typeof this.customers.createOrUpdateCustomer === 'function') {
        try {
          await this.customers.createOrUpdateCustomer({
            phone: phoneNumber,
            name: customerData.name
          });
        } catch (e) {
          console.log('No se pudo actualizar cliente:', e.message);
        }
      }

    } catch (error) {
      console.error('Error al manejar mensaje:', error);
      await whatsappClient.sendMessage(phoneNumber, 'perdon, tuve un problema, proba de nuevo en un ratito');
    }
  }

  async getFullSystemContext() {
    try {
      if (this.backend) {
        return await this.backend.getFullContext();
      } else {
        const phones = await this.stock.getStock();
        return { phones, accessories: [], stores: [] };
      }
    } catch (error) {
      console.error('Error obteniendo contexto del sistema:', error);
      return { phones: [], accessories: [], stores: [] };
    }
  }

  async handleStockQuery(phoneNumber, messageText, customerData) {
    try {
      const productInfo = await this.ai.extractProductInfo(messageText);
      const filters = {};
      if (productInfo?.modelo) filters.search = productInfo.modelo;

      const stock = await this.stock.searchStock(filters);
      this.conversations.updateContext(phoneNumber, {
        lastStockQuery: filters,
        lastStockResults: stock
      });

      const systemContext = await this.getFullSystemContext();
      const context = {
        customerData,
        phones: stock.length > 0 ? stock : systemContext.phones,
        accessories: systemContext.accessories,
        stores: systemContext.stores,
        conversationHistory: this.conversations.getConversation(phoneNumber).messages
      };

      return await this.ai.generateResponse(messageText, context);
    } catch (error) {
      console.error('Error al manejar consulta de stock:', error);
      return 'dame un toque que reviso el stock y te digo';
    }
  }

  async handlePriceQuery(phoneNumber, messageText, customerData) {
    try {
      const productInfo = await this.ai.extractProductInfo(messageText);
      const stock = await this.stock.searchStock(productInfo || {});
      const systemContext = await this.getFullSystemContext();
      
      const context = {
        customerData,
        phones: stock.length > 0 ? stock : systemContext.phones,
        accessories: systemContext.accessories,
        stores: systemContext.stores,
        conversationHistory: this.conversations.getConversation(phoneNumber).messages
      };

      return await this.ai.generateResponse(messageText, context);
    } catch (error) {
      console.error('Error al manejar consulta de precio:', error);
      return 'dame un toque que te averiguo el precio';
    }
  }

  async handlePurchaseIntent(phoneNumber, messageText, customerData) {
    try {
      const conversation = this.conversations.getConversation(phoneNumber);
      const lastStock = conversation.context?.lastStockResults;
      const systemContext = await this.getFullSystemContext();
      
      this.conversations.setState(phoneNumber, 'CONFIRMING_PURCHASE');
      
      const context = {
        customerData,
        phones: lastStock && lastStock.length > 0 ? lastStock : systemContext.phones,
        accessories: systemContext.accessories,
        stores: systemContext.stores,
        conversationHistory: conversation.messages
      };

      return await this.ai.generateResponse(messageText, context);
    } catch (error) {
      console.error('Error al manejar intención de compra:', error);
      return 'dale, que modelo te interesa?';
    }
  }

  async handleFinancingQuery(phoneNumber, messageText) {
    try {
      const systemContext = await this.getFullSystemContext();
      const context = {
        phones: systemContext.phones,
        accessories: systemContext.accessories,
        stores: systemContext.stores,
        conversationHistory: this.conversations.getConversation(phoneNumber).messages
      };

      const response = await this.ai.generateResponse(messageText, context);
      return await this.ai.generateVariedResponse(response, context.conversationHistory);
    } catch (error) {
      console.error('Error al manejar consulta de financiación:', error);
      return 'si, hacemos cuotas sin interes con tarjeta, que modelo te interesa?';
    }
  }

  async handlePaymentLinkRequest(phoneNumber, messageText) {
    try {
      const conversation = this.conversations.getConversation(phoneNumber);
      const lastStock = conversation.context?.lastStockResults;
      const pendingPayment = conversation.context?.pendingPayment;
      
      // Si hay un pago pendiente, usar esos datos
      if (pendingPayment) {
        return await this.generatePaymentResponse(pendingPayment, phoneNumber);
      }
      
      if (lastStock && lastStock.length > 0) {
        const product = lastStock[0];
        const paymentData = {
          title: product.name || product.model || 'Producto',
          price: product.price,
          description: `${product.model || ''} ${product.storage || ''} ${product.color || ''}`.trim()
        };
        
        // Guardar pago pendiente
        this.conversations.updateContext(phoneNumber, { pendingPayment: paymentData });
        
        return await this.generatePaymentResponse(paymentData, phoneNumber);
      } else {
        return 'primero decime que producto queres y te paso los datos para pagar';
      }
    } catch (error) {
      console.error('Error al generar link de pago:', error);
      return 'dame un toque que te paso los datos para pagar';
    }
  }

  async generatePaymentResponse(paymentData, phoneNumber) {
    try {
      // Si MercadoPago está configurado, generar link
      if (this.mp && this.mp.isConfigured()) {
        const customerData = await this.customers.getCustomer(phoneNumber);
        const result = await this.mp.createPaymentLink(paymentData, {
          name: customerData?.name || '',
          phone: phoneNumber.replace('@s.whatsapp.net', '')
        });
        
        if (result.success) {
          return `dale te paso el link de pago: ${result.link} - total $${paymentData.price} por ${paymentData.description}, cuando pagues avisame`;
        }
      }
      
      // Fallback: pasar datos de transferencia
      if (this.mp) {
        return this.mp.formatTransferInfo(paymentData.price, paymentData.description);
      }
      
      return `te paso los datos para transferir - monto: $${paymentData.price} por ${paymentData.description}, cuando transfieras avisame`;
    } catch (error) {
      console.error('Error generando respuesta de pago:', error);
      return 'dame un toque que te paso los datos para pagar';
    }
  }

  // Manejar cuando el cliente dice que ya pagó/transfirió
  async handlePaymentConfirmation(phoneNumber, messageText) {
    try {
      const conversation = this.conversations.getConversation(phoneNumber);
      const pendingPayment = conversation.context?.pendingPayment;
      
      if (!pendingPayment) {
        return 'no tengo registro de un pago pendiente, me pasas el monto que transferiste?';
      }
      
      // Verificar pago en MercadoPago
      if (this.mp && this.mp.isConfigured()) {
        const result = await this.mp.findPayment(pendingPayment.price, 60); // buscar en últimos 60 min
        
        if (result.found) {
          // Limpiar pago pendiente
          this.conversations.updateContext(phoneNumber, { pendingPayment: null });
          return result.message;
        } else {
          return result.message;
        }
      }
      
      return 'dale, dejame verificar el pago y te confirmo en un toque';
    } catch (error) {
      console.error('Error verificando pago:', error);
      return 'dame un toque que verifico el pago';
    }
  }

  // Manejar solicitud de alias/CVU
  async handleTransferDataRequest(phoneNumber) {
    try {
      if (this.mp) {
        const data = this.mp.getTransferData();
        let response = 'te paso los datos para transferir:';
        response += `\nalias: ${data.alias}`;
        if (data.cvu) response += `\ncvu: ${data.cvu}`;
        response += `\ntitular: ${data.titular}`;
        response += '\ncuando transfieras avisame y te confirmo';
        return response;
      }
      return 'dame un toque que te paso los datos';
    } catch (error) {
      console.error('Error obteniendo datos de transferencia:', error);
      return 'dame un toque que te paso los datos';
    }
  }

  async handleAppointmentRequest(phoneNumber, messageText) {
    try {
      const conversation = this.conversations.getConversation(phoneNumber);
      const pendingAppointment = conversation.context?.pendingAppointment || {};
      
      const newInfo = await this.ai.extractAppointmentInfo(messageText, conversation.messages);
      
      const appointmentInfo = {
        fecha: newInfo?.fecha || pendingAppointment.fecha,
        hora: newInfo?.hora || pendingAppointment.hora,
        nombre: newInfo?.nombre || pendingAppointment.nombre || conversation.context?.customerName,
        producto: newInfo?.producto || pendingAppointment.producto || conversation.context?.lastStockResults?.[0]?.name,
      };
      
      console.log('📅 Info turno combinada:', appointmentInfo);

      if (appointmentInfo.fecha && appointmentInfo.hora) {
        const appointmentData = {
          date: appointmentInfo.fecha,
          time: appointmentInfo.hora,
          customerName: appointmentInfo.nombre || `Cliente ${phoneNumber.slice(-4)}`,
          customerPhone: phoneNumber.replace('@s.whatsapp.net', ''),
          product: appointmentInfo.producto || 'Consulta',
          notes: 'Turno agendado por WhatsApp',
          source: 'WHATSAPP'
        };

        const result = await this.salesFlow.scheduleAppointment(appointmentData);
        
        if (result.success) {
          this.conversations.updateContext(phoneNumber, { pendingAppointment: null });
          this.conversations.setState(phoneNumber, 'APPOINTMENT_CONFIRMED');
          return `listo te agende para el ${appointmentInfo.fecha} a las ${appointmentInfo.hora}, te espero`;
        } else {
          return 'ese horario no esta disponible, tenes otro dia u hora?';
        }
      }

      this.conversations.setState(phoneNumber, 'SCHEDULING_APPOINTMENT');
      this.conversations.updateContext(phoneNumber, { pendingAppointment: appointmentInfo });

      if (!appointmentInfo.fecha && !appointmentInfo.hora) {
        return 'dale, que dia y hora te viene bien?';
      } else if (!appointmentInfo.fecha) {
        return 'que dia te viene bien?';
      } else if (!appointmentInfo.hora) {
        return `el ${appointmentInfo.fecha} a que hora podes?`;
      }

      return 'dale, decime dia y hora y te agendo';
    } catch (error) {
      console.error('Error al manejar solicitud de turno:', error);
      return 'dale, decime que dia y hora te viene bien y te agendo';
    }
  }

  async handleAppointmentModification(phoneNumber, messageText) {
    try {
      const response = await this.salesFlow.modifyAppointment(phoneNumber, {});
      return response.message;
    } catch (error) {
      console.error('Error al modificar turno:', error);
      return 'hubo un problema al modificar el turno, decime que necesitas cambiar';
    }
  }

  async handleAppointmentCancellation(phoneNumber) {
    try {
      const response = await this.salesFlow.cancelAppointment(phoneNumber);
      return response.message;
    } catch (error) {
      console.error('Error al cancelar turno:', error);
      return 'hubo un problema al cancelar el turno, dame un toque';
    }
  }

  async handleAppointmentQuery(phoneNumber) {
    try {
      const appointments = await this.salesFlow.appointmentsManager.getCustomerAppointments(phoneNumber);
      
      if (appointments.length === 0) {
        return 'no tenes turnos agendados, queres sacar uno?';
      }

      let response = 'tus turnos: ';
      appointments.forEach((apt, i) => {
        if (i > 0) response += ', ';
        response += `${apt.fecha} a las ${apt.hora}`;
        if (apt.producto) response += ` (${apt.producto})`;
      });

      return response + ' - necesitas modificar alguno?';
    } catch (error) {
      console.error('Error al consultar turnos:', error);
      return 'dame un toque que te reviso los turnos';
    }
  }

  async handleRefundRequest(phoneNumber, messageText) {
    try {
      const systemContext = await this.getFullSystemContext();
      const context = {
        phones: systemContext.phones,
        stores: systemContext.stores,
        conversationHistory: this.conversations.getConversation(phoneNumber).messages
      };

      this.conversations.setState(phoneNumber, 'PROCESSING_REFUND');
      return await this.ai.generateResponse(messageText, context);
    } catch (error) {
      console.error('Error al manejar reembolso:', error);
      return 'dale no hay drama con la devolucion, tenes 30 dias desde la compra, tenes la factura?';
    }
  }

  async handleExchangeRequest(phoneNumber, messageText) {
    try {
      const systemContext = await this.getFullSystemContext();
      const context = {
        phones: systemContext.phones,
        stores: systemContext.stores,
        conversationHistory: this.conversations.getConversation(phoneNumber).messages
      };

      this.conversations.setState(phoneNumber, 'PROCESSING_EXCHANGE');
      return await this.ai.generateResponse(messageText, context);
    } catch (error) {
      console.error('Error al manejar cambio:', error);
      return 'dale hacemos el cambio sin drama, que producto queres cambiar y por cual?';
    }
  }

  async handleDefectiveProduct(phoneNumber, messageText) {
    try {
      const systemContext = await this.getFullSystemContext();
      const context = {
        phones: systemContext.phones,
        stores: systemContext.stores,
        conversationHistory: this.conversations.getConversation(phoneNumber).messages
      };

      this.conversations.setState(phoneNumber, 'HANDLING_DEFECT');
      return await this.ai.generateResponse(messageText, context);
    } catch (error) {
      console.error('Error al manejar producto defectuoso:', error);
      return 'uh que bajon, traelo que te lo cambiamos, si no tenemos el mismo te damos uno mejor';
    }
  }

  async handleComplaint(phoneNumber, messageText, intent) {
    try {
      const complaintAnalysis = await this.ai.analyzeComplaint(messageText);
      
      this.conversations.updateContext(phoneNumber, {
        complaint: complaintAnalysis,
        complaintMessage: messageText
      });

      this.conversations.setState(phoneNumber, 'HANDLING_COMPLAINT');

      const context = {
        conversationHistory: this.conversations.getConversation(phoneNumber).messages,
        complaintData: complaintAnalysis
      };

      let response = await this.ai.generateResponse(messageText, context);
      
      if (complaintAnalysis.requiere_escalamiento) {
        console.log(`🚨 QUEJA REQUIERE ESCALAMIENTO - Cliente: ${phoneNumber}`);
        console.log(`Tipo: ${complaintAnalysis.tipo}, Gravedad: ${complaintAnalysis.gravedad}`);
        response += ' - te paso con mi supervisor para que te ayude mejor';
      }

      return response;
    } catch (error) {
      console.error('Error al manejar queja:', error);
      return 'te entiendo, tenes razon, vamos a solucionarlo ya mismo';
    }
  }

  async handleTechnicalSupport(phoneNumber, messageText) {
    try {
      const systemContext = await this.getFullSystemContext();
      const context = {
        phones: systemContext.phones,
        stores: systemContext.stores,
        conversationHistory: this.conversations.getConversation(phoneNumber).messages
      };

      this.conversations.setState(phoneNumber, 'TECHNICAL_SUPPORT');
      return await this.ai.generateResponse(messageText, context);
    } catch (error) {
      console.error('Error al manejar soporte técnico:', error);
      return 'dale contame que problema tenes y vemos como lo solucionamos';
    }
  }

  async handleWarrantyQuery(phoneNumber, messageText) {
    try {
      const systemContext = await this.getFullSystemContext();
      const context = {
        phones: systemContext.phones,
        stores: systemContext.stores,
        conversationHistory: this.conversations.getConversation(phoneNumber).messages
      };

      return await this.ai.generateResponse(messageText, context);
    } catch (error) {
      console.error('Error al manejar consulta de garantía:', error);
      return 'la garantia es de 6 meses por defectos de fabrica, que problema tenes?';
    }
  }

  async handleScheduleQuery(phoneNumber) {
    try {
      const systemContext = await this.getFullSystemContext();
      const stores = systemContext.stores || [];
      
      if (stores.length > 0) {
        let response = 'tenemos estas sucursales: ';
        stores.forEach((store, i) => {
          if (i > 0) response += ', ';
          response += store.name;
          if (store.address) response += ` (${store.address})`;
        });
        response += ' - horario: lunes a viernes 9 a 19hs, sabados 9 a 17hs';
        return response;
      }
      
      return 'lunes a viernes 9 a 19hs, sabados 9 a 17hs, queres sacar turno?';
    } catch (error) {
      console.error('Error al manejar consulta de horarios:', error);
      return 'lunes a viernes 9 a 19hs, sabados 9 a 17hs';
    }
  }

  async handleShippingQuery(phoneNumber, messageText) {
    try {
      const systemContext = await this.getFullSystemContext();
      const context = {
        phones: systemContext.phones,
        accessories: systemContext.accessories,
        stores: systemContext.stores,
        conversationHistory: this.conversations.getConversation(phoneNumber).messages
      };

      return await this.ai.generateResponse(messageText, context);
    } catch (error) {
      console.error('Error al manejar consulta de envíos:', error);
      return 'si hacemos envios a todo el pais, a donde seria?';
    }
  }

  async handleGeneralConversation(phoneNumber, messageText, customerData) {
    try {
      const conversation = this.conversations.getConversation(phoneNumber);
      const systemContext = await this.getFullSystemContext();
      
      const context = {
        customerData,
        phones: conversation.context?.lastStockResults || systemContext.phones,
        accessories: systemContext.accessories,
        stores: systemContext.stores,
        conversationHistory: conversation.messages
      };

      const response = await this.ai.generateResponse(messageText, context);
      return await this.ai.generateVariedResponse(response, context.conversationHistory);
    } catch (error) {
      console.error('Error en conversación general:', error);
      return 'perdon, no te entendi, me repetis?';
    }
  }

  async handleAdminCommand(command, phoneNumber, whatsappClient) {
    try {
      const cmd = command.toLowerCase().trim();

      if (cmd === '!stats') {
        const stats = await this.salesFlow.salesManager.getStats();
        if (stats) {
          return `estadisticas del dia - ventas: ${stats.totalSales}, facturacion: ${stats.totalRevenue}, pendientes: ${stats.pendingSales}, completadas: ${stats.completedSales}`;
        }
      }

      if (cmd === '!stock') {
        const stock = await this.stock.getStock();
        return this.stock.formatStockForDisplay(stock);
      }

      if (cmd === '!turnos') {
        const appointments = await this.salesFlow.appointmentsManager.getTodayAppointments();
        if (appointments.length === 0) {
          return 'no hay turnos para hoy';
        }
        
        let message = 'turnos de hoy: ';
        appointments.forEach((apt, i) => {
          if (i > 0) message += ', ';
          message += `${apt.hora} - ${apt.nombre} (${apt.producto})`;
        });
        return message;
      }

      if (cmd === '!clientes') {
        const customers = await this.customers.getAllCustomers();
        const recent = customers.slice(-10);
        
        let message = 'ultimos clientes: ';
        recent.forEach((c, i) => {
          if (i > 0) message += ', ';
          message += `${c.name} (${c.phone})`;
        });
        return message;
      }

      // Comandos de MercadoPago
      if (cmd === '!pagos' && this.mp) {
        const summary = await this.mp.getDailySummary();
        return summary.message;
      }

      if (cmd === '!alias' && this.mp) {
        const data = this.mp.getTransferData();
        return `alias: ${data.alias} - cvu: ${data.cvu} - titular: ${data.titular}`;
      }

      if (cmd === '!balance' && this.mp && this.mp.isConfigured()) {
        const balance = await this.mp.getAccountBalance();
        if (balance.success) {
          return `balance MP - disponible: $${balance.available?.toLocaleString('es-AR') || 0}, total: $${balance.total?.toLocaleString('es-AR') || 0}`;
        }
        return 'no pude obtener el balance';
      }

      return 'comandos disponibles: !stats, !stock, !turnos, !clientes, !pagos, !alias, !balance';
    } catch (error) {
      console.error('Error al ejecutar comando admin:', error);
      return 'error al ejecutar comando';
    }
  }
}

export default MessageHandler;
