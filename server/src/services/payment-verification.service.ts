import axios from 'axios';
import { prisma } from '../lib/prisma';

interface MercadoPagoPayment {
  id: number;
  date_created: string;
  date_approved: string | null;
  money_release_date: string | null;
  operation_type: string;
  issuer_id: string;
  payment_method_id: string;
  payment_type_id: string;
  status: string;
  status_detail: string;
  currency_id: string;
  description: string;
  transaction_amount: number;
  transaction_amount_refunded: number;
  coupon_amount: number;
  transaction_details: {
    net_received_amount: number;
    total_paid_amount: number;
    overpaid_amount: number;
    installment_amount: number;
  };
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

class PaymentVerificationService {
  private mpAccessToken: string;
  private mpClient: any;
  private binanceApiKey: string;
  private binanceSecretKey: string;
  
  // Configuración de tu cuenta
  private mpAlias: string;
  private mpCBU: string;
  private mpTitular: string;
  private mpBanco: string;
  
  constructor() {
    this.mpAccessToken = process.env.MP_ACCESS_TOKEN || '';
    this.binanceApiKey = process.env.BINANCE_API_KEY || '';
    this.binanceSecretKey = process.env.BINANCE_SECRET_KEY || '';
    
    // Datos de tu cuenta de MercadoPago
    this.mpAlias = process.env.MP_ALIAS || '';
    this.mpCBU = process.env.MP_CBU || '';
    this.mpTitular = process.env.MP_TITULAR || '';
    this.mpBanco = process.env.MP_BANCO || 'Mercado Pago';
    
    if (this.mpAccessToken) {
      this.mpClient = axios.create({
        baseURL: 'https://api.mercadopago.com',
        headers: {
          'Authorization': `Bearer ${this.mpAccessToken}`,
          'Content-Type': 'application/json'
        }
      });
    }
  }
  
  // Obtener datos de transferencia para mostrar al usuario
  getTransferData() {
    return {
      banco: this.mpBanco,
      titular: this.mpTitular,
      cbu: this.mpCBU,
      alias: this.mpAlias
    };
  }
  
  // Verificar pago de MercadoPago
  async verifyMercadoPagoPayment(paymentId: string, expectedAmount: number, createdAt: Date): Promise<boolean> {
    try {
      if (!this.mpAccessToken) {
        console.log('⚠️ MercadoPago no configurado');
        return false;
      }
      
      // Buscar pagos recientes (últimos 15 minutos)
      const fromDate = new Date(createdAt.getTime() - 5 * 60 * 1000); // 5 min antes
      const toDate = new Date(createdAt.getTime() + 15 * 60 * 1000); // 15 min después
      
      const response = await this.mpClient.get('/v1/payments/search', {
        params: {
          sort: 'date_created',
          criteria: 'desc',
          range: 'date_created',
          begin_date: fromDate.toISOString(),
          end_date: toDate.toISOString(),
          limit: 50
        }
      });
      
      const payments: MercadoPagoPayment[] = response.data.results;
      
      // Buscar pago que coincida con el monto esperado
      const matchingPayment = payments.find(p => {
        const amountMatch = Math.abs(p.transaction_amount - expectedAmount) < 0.01;
        const statusOk = p.status === 'approved';
        const timeMatch = new Date(p.date_created) >= fromDate && new Date(p.date_created) <= toDate;
        
        return amountMatch && statusOk && timeMatch;
      });
      
      if (matchingPayment) {
        console.log(`✅ Pago encontrado: $${matchingPayment.transaction_amount} - ID: ${matchingPayment.id}`);
        
        // Actualizar payment con el ID externo
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            externalId: matchingPayment.id.toString(),
            externalStatus: matchingPayment.status,
            status: 'completed',
            paidAt: new Date(matchingPayment.date_approved || matchingPayment.date_created),
            metadata: JSON.stringify({
              paymentMethodId: matchingPayment.payment_method_id,
              paymentTypeId: matchingPayment.payment_type_id,
              payerEmail: matchingPayment.payer.email
            })
          }
        });
        
        return true;
      }
      
      console.log(`⏳ Pago no encontrado aún para $${expectedAmount}`);
      return false;
      
    } catch (error: any) {
      console.error('Error verificando pago de MercadoPago:', error.response?.data || error.message);
      return false;
    }
  }
  
  // Verificar pago de Binance (USDT)
  async verifyBinancePayment(paymentId: string, walletAddress: string, expectedAmount: number, createdAt: Date): Promise<boolean> {
    try {
      if (!this.binanceApiKey) {
        console.log('⚠️ Binance no configurado');
        return false;
      }
      
      // Aquí iría la integración con Binance Pay API o TronScan API
      // Por ahora simulamos la verificación
      
      console.log(`🔍 Verificando pago USDT en ${walletAddress} por ${expectedAmount} USDT`);
      
      // TODO: Implementar verificación real con TronScan API o Binance Pay
      // const response = await axios.get(`https://apilist.tronscan.org/api/transaction?address=${walletAddress}`);
      
      return false;
      
    } catch (error: any) {
      console.error('Error verificando pago de Binance:', error.message);
      return false;
    }
  }
  
  // Verificar pago pendiente (llamado por cron job)
  async verifyPendingPayment(paymentId: string): Promise<boolean> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { tenant: true }
      });
      
      if (!payment) {
        console.log(`❌ Payment ${paymentId} no encontrado`);
        return false;
      }
      
      if (payment.status !== 'pending' && payment.status !== 'verifying') {
        console.log(`⏭️ Payment ${paymentId} ya está en estado ${payment.status}`);
        return false;
      }
      
      // Verificar si expiró (10 minutos)
      if (payment.expiresAt && new Date() > payment.expiresAt) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'expired' }
        });
        console.log(`⏰ Payment ${paymentId} expiró`);
        return false;
      }
      
      // Verificar según el método de pago
      let verified = false;
      
      if (payment.method === 'mercadopago') {
        verified = await this.verifyMercadoPagoPayment(
          paymentId,
          payment.amount,
          payment.createdAt
        );
      } else if (payment.method === 'binance' && payment.walletAddress) {
        verified = await this.verifyBinancePayment(
          paymentId,
          payment.walletAddress,
          payment.amount,
          payment.createdAt
        );
      }
      
      if (verified) {
        // Activar suscripción
        await this.activateSubscription(payment.tenantId, payment.subscriptionId);
      }
      
      return verified;
      
    } catch (error: any) {
      console.error(`Error verificando payment ${paymentId}:`, error.message);
      return false;
    }
  }
  
  // Activar suscripción después de pago confirmado
  private async activateSubscription(tenantId: string, subscriptionId: string | null) {
    try {
      if (subscriptionId) {
        // Actualizar suscripción existente
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 días
          }
        });
        
        console.log(`✅ Suscripción ${subscriptionId} activada`);
      }
      
      // Actualizar tenant
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          paymentStatus: 'active',
          active: true,
          planExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 días
          nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          lastPaymentDate: new Date()
        }
      });
      
      console.log(`✅ Tenant ${tenantId} activado`);
      
      // TODO: Enviar email de confirmación
      
    } catch (error: any) {
      console.error('Error activando suscripción:', error.message);
    }
  }
  
  // Verificar todos los pagos pendientes (cron job)
  async verifyAllPendingPayments() {
    try {
      const pendingPayments = await prisma.payment.findMany({
        where: {
          status: { in: ['pending', 'verifying'] },
          expiresAt: { gt: new Date() } // No expirados
        },
        take: 50
      });
      
      console.log(`🔍 Verificando ${pendingPayments.length} pagos pendientes...`);
      
      for (const payment of pendingPayments) {
        await this.verifyPendingPayment(payment.id);
        // Esperar 1 segundo entre verificaciones para no saturar la API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error: any) {
      console.error('Error verificando pagos pendientes:', error.message);
    }
  }
}

export const paymentVerificationService = new PaymentVerificationService();
