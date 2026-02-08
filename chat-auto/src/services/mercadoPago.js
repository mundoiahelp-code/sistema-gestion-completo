import axios from 'axios';
import { config } from '../config/config.js';

class MercadoPagoService {
  constructor() {
    this.accessToken = config.mercadoPago?.accessToken || process.env.MP_ACCESS_TOKEN;
    this.publicKey = config.mercadoPago?.publicKey || process.env.MP_PUBLIC_KEY;
    this.alias = config.mercadoPago?.alias || process.env.MP_ALIAS || 'tu.alias.mp';
    this.cvu = config.mercadoPago?.cvu || process.env.MP_CVU || '';
    this.titular = config.mercadoPago?.titular || process.env.MP_TITULAR || 'NOMBRE TITULAR';
    
    this.client = axios.create({
      baseURL: 'https://api.mercadopago.com',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Cache de pagos recientes
    this.paymentsCache = {
      data: [],
      timestamp: 0
    };
    this.cacheTTL = 30000; // 30 segundos
  }

  // Obtener datos de la cuenta para transferencias
  getTransferData() {
    return {
      alias: this.alias,
      cvu: this.cvu,
      titular: this.titular
    };
  }

  // Formatear datos de transferencia para enviar al cliente
  formatTransferInfo(amount, description = '') {
    let message = `te paso los datos para transferir:`;
    message += `\nalias: ${this.alias}`;
    if (this.cvu) {
      message += `\ncvu: ${this.cvu}`;
    }
    message += `\ntitular: ${this.titular}`;
    if (amount) {
      message += `\nmonto: $${amount}`;
    }
    if (description) {
      message += `\nconcepto: ${description}`;
    }
    message += `\ncuando transfieras avisame y te confirmo`;
    return message;
  }

  // Crear link de pago (Checkout Pro)
  async createPaymentLink(productData, customerData = {}) {
    try {
      const preference = {
        items: [{
          title: productData.title || productData.name || 'Producto',
          description: productData.description || '',
          quantity: productData.quantity || 1,
          currency_id: 'ARS',
          unit_price: parseFloat(productData.price)
        }],
        payer: {
          name: customerData.name || '',
          phone: {
            number: customerData.phone || ''
          }
        },
        back_urls: {
          success: config.mercadoPago?.successUrl || 'https://tudominio.com/success',
          failure: config.mercadoPago?.failureUrl || 'https://tudominio.com/failure',
          pending: config.mercadoPago?.pendingUrl || 'https://tudominio.com/pending'
        },
        auto_return: 'approved',
        external_reference: productData.externalReference || `order_${Date.now()}`,
        notification_url: config.mercadoPago?.webhookUrl || null,
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
      };

      const response = await this.client.post('/checkout/preferences', preference);
      
      return {
        success: true,
        link: response.data.init_point,
        sandboxLink: response.data.sandbox_init_point,
        preferenceId: response.data.id,
        externalReference: preference.external_reference
      };
    } catch (error) {
      console.error('Error creando link de pago MP:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al crear link de pago'
      };
    }
  }

  // Crear QR para cobrar (Point)
  async createQRPayment(amount, description = '') {
    try {
      // Primero obtener el user_id y el external_id de la caja
      const userResponse = await this.client.get('/users/me');
      const userId = userResponse.data.id;

      // Crear orden de pago para QR
      const orderData = {
        external_reference: `qr_${Date.now()}`,
        title: description || 'Pago en tienda',
        description: description,
        total_amount: parseFloat(amount),
        items: [{
          title: description || 'Producto',
          unit_price: parseFloat(amount),
          quantity: 1,
          unit_measure: 'unit',
          total_amount: parseFloat(amount)
        }]
      };

      // Nota: Para QR dinámico necesitas tener configurada una caja/sucursal en MP
      // Por ahora retornamos los datos para transferencia como alternativa
      return {
        success: true,
        type: 'transfer',
        message: this.formatTransferInfo(amount, description)
      };
    } catch (error) {
      console.error('Error creando QR:', error.response?.data || error.message);
      return {
        success: false,
        error: 'Error al crear QR, usa transferencia'
      };
    }
  }

  // Buscar pagos recientes
  async getRecentPayments(limit = 20) {
    try {
      // Usar cache si es válido
      if (this.paymentsCache.data.length > 0 && 
          (Date.now() - this.paymentsCache.timestamp) < this.cacheTTL) {
        return this.paymentsCache.data;
      }

      const response = await this.client.get('/v1/payments/search', {
        params: {
          sort: 'date_created',
          criteria: 'desc',
          limit: limit,
          range: 'date_created',
          begin_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // últimos 7 días
          end_date: new Date().toISOString()
        }
      });

      const payments = response.data.results.map(p => ({
        id: p.id,
        amount: p.transaction_amount,
        status: p.status,
        statusDetail: p.status_detail,
        description: p.description,
        payerEmail: p.payer?.email,
        payerName: p.payer?.first_name,
        date: p.date_created,
        externalReference: p.external_reference,
        paymentMethod: p.payment_method_id,
        paymentType: p.payment_type_id
      }));

      // Actualizar cache
      this.paymentsCache = {
        data: payments,
        timestamp: Date.now()
      };

      return payments;
    } catch (error) {
      console.error('Error obteniendo pagos:', error.response?.data || error.message);
      return [];
    }
  }

  // Buscar un pago específico por monto y fecha aproximada
  async findPayment(amount, minutesAgo = 30) {
    try {
      const payments = await this.getRecentPayments(50);
      const targetAmount = parseFloat(amount);
      const cutoffTime = Date.now() - (minutesAgo * 60 * 1000);

      // Buscar pagos que coincidan con el monto (con tolerancia de $10)
      const matchingPayments = payments.filter(p => {
        const paymentDate = new Date(p.date).getTime();
        const amountMatch = Math.abs(p.amount - targetAmount) <= 10;
        const timeMatch = paymentDate >= cutoffTime;
        const statusMatch = p.status === 'approved';
        
        return amountMatch && timeMatch && statusMatch;
      });

      if (matchingPayments.length > 0) {
        return {
          found: true,
          payment: matchingPayments[0],
          message: `si, ya me llegó el pago de $${matchingPayments[0].amount}, gracias!`
        };
      }

      return {
        found: false,
        message: 'todavia no me aparece el pago, fijate si se procesó bien y avisame'
      };
    } catch (error) {
      console.error('Error buscando pago:', error);
      return {
        found: false,
        message: 'no pude verificar el pago, dame un toque y lo reviso manual'
      };
    }
  }

  // Verificar estado de un pago por ID
  async getPaymentStatus(paymentId) {
    try {
      const response = await this.client.get(`/v1/payments/${paymentId}`);
      const payment = response.data;

      const statusMessages = {
        'approved': 'aprobado',
        'pending': 'pendiente',
        'in_process': 'en proceso',
        'rejected': 'rechazado',
        'refunded': 'devuelto',
        'cancelled': 'cancelado',
        'charged_back': 'contracargo'
      };

      return {
        success: true,
        status: payment.status,
        statusText: statusMessages[payment.status] || payment.status,
        amount: payment.transaction_amount,
        date: payment.date_created,
        description: payment.description
      };
    } catch (error) {
      console.error('Error verificando pago:', error.response?.data || error.message);
      return {
        success: false,
        error: 'No pude verificar el pago'
      };
    }
  }

  // Obtener balance de la cuenta
  async getAccountBalance() {
    try {
      const response = await this.client.get('/users/me');
      const userId = response.data.id;
      
      const balanceResponse = await this.client.get(`/users/${userId}/mercadopago_account/balance`);
      
      return {
        success: true,
        available: balanceResponse.data.available_balance,
        total: balanceResponse.data.total_amount,
        unavailable: balanceResponse.data.unavailable_balance
      };
    } catch (error) {
      console.error('Error obteniendo balance:', error.response?.data || error.message);
      return {
        success: false,
        error: 'No pude obtener el balance'
      };
    }
  }

  // Formatear resumen de pagos del día
  async getDailySummary() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const response = await this.client.get('/v1/payments/search', {
        params: {
          sort: 'date_created',
          criteria: 'desc',
          begin_date: today.toISOString(),
          end_date: new Date().toISOString(),
          status: 'approved'
        }
      });

      const payments = response.data.results;
      const total = payments.reduce((sum, p) => sum + p.transaction_amount, 0);

      return {
        success: true,
        count: payments.length,
        total: total,
        message: `hoy entraron ${payments.length} pagos por un total de $${total.toLocaleString('es-AR')}`
      };
    } catch (error) {
      console.error('Error obteniendo resumen:', error.response?.data || error.message);
      return {
        success: false,
        message: 'no pude obtener el resumen de hoy'
      };
    }
  }

  // Crear link de pago simple (solo monto)
  async createSimplePaymentLink(amount, description = 'Pago') {
    return await this.createPaymentLink({
      title: description,
      price: amount,
      quantity: 1
    });
  }

  // Verificar si el servicio está configurado
  isConfigured() {
    return !!(this.accessToken && this.accessToken !== 'tu_access_token_aqui');
  }
}

export default MercadoPagoService;
