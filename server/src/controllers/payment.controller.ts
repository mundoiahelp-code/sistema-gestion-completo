import { Response, Request } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import { paymentVerificationService } from '../services/payment-verification.service';

// Schema de validación
const createPaymentSchema = z.object({
  plan: z.enum(['pro', 'enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
  paymentMethod: z.enum(['mercadopago', 'binance', 'card']),
  autoRenew: z.boolean().default(false)
});

const verifyPaymentSchema = z.object({
  paymentId: z.string()
});

// Precios de los planes
const PLAN_PRICES = {
  pro: {
    monthly: 9.99,
    yearly: 99.99
  },
  enterprise: {
    monthly: 29.99,
    yearly: 299.99
  }
};

// Crear intención de pago
export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const validatedData = createPaymentSchema.parse(req.body);
    
    // Calcular monto según plan y ciclo
    const amount = PLAN_PRICES[validatedData.plan][validatedData.billingCycle];
    
    // Crear suscripción
    const subscription = await prisma.subscription.create({
      data: {
        tenantId: tenantId!,
        plan: validatedData.plan,
        status: 'pending',
        billingCycle: validatedData.billingCycle,
        amount,
        currency: 'USD',
        paymentMethod: validatedData.paymentMethod,
        autoRenew: validatedData.autoRenew,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 días
      }
    });
    
    // Crear payment
    const payment = await prisma.payment.create({
      data: {
        tenantId: tenantId!,
        subscriptionId: subscription.id,
        amount,
        currency: 'USD',
        method: validatedData.paymentMethod,
        status: 'pending',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // +10 minutos
      }
    });
    
    // Obtener datos de transferencia si es MercadoPago
    let transferData = null;
    if (validatedData.paymentMethod === 'mercadopago') {
      transferData = paymentVerificationService.getTransferData();
    }
    
    // Generar dirección de wallet si es Binance
    let walletData = null;
    if (validatedData.paymentMethod === 'binance') {
      // TODO: Generar dirección única o usar dirección fija
      walletData = {
        network: 'TRC20',
        address: process.env.BINANCE_WALLET_ADDRESS || 'TXxxx...xxxxx',
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${process.env.BINANCE_WALLET_ADDRESS}`
      };
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: { walletAddress: walletData.address }
      });
    }
    
    res.json({
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        expiresAt: payment.expiresAt
      },
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        billingCycle: subscription.billingCycle
      },
      transferData,
      walletData
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Error creando pago:', error);
    res.status(500).json({ error: 'Error al crear pago' });
  }
};

// Verificar pago manualmente
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = verifyPaymentSchema.parse(req.body);
    const tenantId = req.user?.tenantId;
    
    // Verificar que el payment pertenezca al tenant
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, tenantId }
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    if (payment.status === 'completed') {
      return res.json({ verified: true, message: 'Pago ya confirmado' });
    }
    
    if (payment.status === 'expired') {
      return res.status(400).json({ error: 'El tiempo de pago expiró' });
    }
    
    // Marcar como "verificando"
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'verifying' }
    });
    
    // Intentar verificar el pago
    const verified = await paymentVerificationService.verifyPendingPayment(paymentId);
    
    if (verified) {
      return res.json({ 
        verified: true, 
        message: 'Pago confirmado exitosamente' 
      });
    } else {
      // Volver a pending para reintentar
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'pending' }
      });
      
      return res.json({ 
        verified: false, 
        message: 'Pago no encontrado aún. Por favor, espera unos segundos e intenta de nuevo.' 
      });
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Error verificando pago:', error);
    res.status(500).json({ error: 'Error al verificar pago' });
  }
};

// Obtener estado del pago
export const getPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    
    const payment = await prisma.payment.findFirst({
      where: { id, tenantId },
      include: {
        subscription: true
      }
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    // Calcular tiempo restante
    const now = new Date();
    const expiresAt = payment.expiresAt ? new Date(payment.expiresAt) : null;
    const timeRemaining = expiresAt ? Math.max(0, expiresAt.getTime() - now.getTime()) : 0;
    
    res.json({
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        expiresAt: payment.expiresAt,
        timeRemaining: Math.floor(timeRemaining / 1000), // en segundos
        paidAt: payment.paidAt
      },
      subscription: payment.subscription ? {
        id: payment.subscription.id,
        plan: payment.subscription.plan,
        status: payment.subscription.status
      } : null
    });
    
  } catch (error) {
    console.error('Error obteniendo estado del pago:', error);
    res.status(500).json({ error: 'Error al obtener estado del pago' });
  }
};

// Obtener historial de pagos
export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { page = '1', limit = '20' } = req.query;
    
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { tenantId },
        include: {
          subscription: {
            select: {
              plan: true,
              billingCycle: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      }),
      prisma.payment.count({ where: { tenantId } })
    ]);
    
    res.json({
      payments,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo historial de pagos:', error);
    res.status(500).json({ error: 'Error al obtener historial de pagos' });
  }
};

// Webhook de MercadoPago
export const mercadoPagoWebhook = async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;
    
    console.log('📥 Webhook de MercadoPago:', type, data);
    
    if (type === 'payment') {
      const paymentId = data.id;
      
      // Buscar payment en nuestra DB que coincida
      const payment = await prisma.payment.findFirst({
        where: {
          externalId: paymentId.toString(),
          status: { in: ['pending', 'verifying'] }
        }
      });
      
      if (payment) {
        await paymentVerificationService.verifyPendingPayment(payment.id);
      }
    }
    
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Error en webhook de MercadoPago:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
};

// ============================================
// ENDPOINTS PÚBLICOS (para nuevos usuarios)
// ============================================

const createPublicPaymentSchema = z.object({
  plan: z.enum(['basic', 'pro']),
  billingCycle: z.enum(['monthly', 'yearly']).default('monthly'),
  paymentMethod: z.enum(['mercadopago', 'crypto']),
  autoRenew: z.boolean().default(false),
  ownerName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional()
});

// Crear pago público (sin autenticación)
export const createPublicPayment = async (req: Request, res: Response) => {
  try {
    const validatedData = createPublicPaymentSchema.parse(req.body);
    
    // Calcular monto según plan y ciclo
    const planPrices = {
      basic: { monthly: 59, yearly: 590 },
      pro: { monthly: 179, yearly: 1790 }
    };
    
    const amount = planPrices[validatedData.plan][validatedData.billingCycle];
    const currency = 'USD'; // Siempre en USD
    
    // Crear un tenant temporal o buscar si ya existe por email
    let tenant = await prisma.tenant.findFirst({
      where: { email: validatedData.email }
    });
    
    if (!tenant) {
      // Crear tenant temporal con slug único
      const slug = `${validatedData.ownerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      
      tenant = await prisma.tenant.create({
        data: {
          name: `${validatedData.ownerName}'s Store`,
          slug,
          email: validatedData.email,
          phone: validatedData.phone || '',
          paymentStatus: 'pending',
          active: false,
          plan: validatedData.plan
        }
      });
    }
    
    // Crear suscripción
    const subscription = await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        plan: validatedData.plan,
        status: 'pending',
        billingCycle: validatedData.billingCycle,
        amount,
        currency,
        paymentMethod: validatedData.paymentMethod,
        autoRenew: validatedData.autoRenew,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    
    // Crear payment
    const payment = await prisma.payment.create({
      data: {
        tenantId: tenant.id,
        subscriptionId: subscription.id,
        amount,
        currency,
        method: validatedData.paymentMethod,
        status: 'pending',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // +10 minutos
      }
    });
    
    // Obtener datos de transferencia si es MercadoPago
    let transferData = null;
    if (validatedData.paymentMethod === 'mercadopago') {
      transferData = paymentVerificationService.getTransferData();
    }
    
    // Generar dirección de wallet si es Crypto
    let walletData = null;
    if (validatedData.paymentMethod === 'crypto') {
      walletData = {
        network: 'TRC20',
        address: process.env.BINANCE_WALLET_ADDRESS || 'TXxxx...xxxxx',
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${process.env.BINANCE_WALLET_ADDRESS}`
      };
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: { walletAddress: walletData.address }
      });
    }
    
    res.json({
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        expiresAt: payment.expiresAt
      },
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        billingCycle: subscription.billingCycle
      },
      tenant: {
        id: tenant.id,
        email: tenant.email
      },
      transferData,
      walletData
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Error creando pago público:', error);
    res.status(500).json({ error: 'Error al crear pago' });
  }
};

// Verificar pago público
export const verifyPublicPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId } = verifyPaymentSchema.parse(req.body);
    
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    if (payment.status === 'completed') {
      return res.json({ verified: true, message: 'Pago ya confirmado' });
    }
    
    if (payment.status === 'expired') {
      return res.status(400).json({ error: 'El tiempo de pago expiró' });
    }
    
    // Marcar como "verificando"
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'verifying' }
    });
    
    // Intentar verificar el pago
    const verified = await paymentVerificationService.verifyPendingPayment(paymentId);
    
    if (verified) {
      return res.json({ 
        verified: true, 
        message: 'Pago confirmado exitosamente' 
      });
    } else {
      // Volver a pending para reintentar
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'pending' }
      });
      
      return res.json({ 
        verified: false, 
        message: 'Pago no encontrado aún. Por favor, espera unos segundos e intenta de nuevo.' 
      });
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Error verificando pago público:', error);
    res.status(500).json({ error: 'Error al verificar pago' });
  }
};

// Obtener estado del pago público
export const getPublicPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        subscription: true
      }
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    // Calcular tiempo restante
    const now = new Date();
    const expiresAt = payment.expiresAt ? new Date(payment.expiresAt) : null;
    const timeRemaining = expiresAt ? Math.max(0, expiresAt.getTime() - now.getTime()) : 0;
    
    res.json({
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        expiresAt: payment.expiresAt,
        timeRemaining: Math.floor(timeRemaining / 1000), // en segundos
        paidAt: payment.paidAt
      },
      subscription: payment.subscription ? {
        id: payment.subscription.id,
        plan: payment.subscription.plan,
        status: payment.subscription.status
      } : null
    });
    
  } catch (error) {
    console.error('Error obteniendo estado del pago público:', error);
    res.status(500).json({ error: 'Error al obtener estado del pago' });
  }
};

// ============================================
// ENDPOINTS DE ACTIVACIÓN CON CÓDIGO
// ============================================

const sendVerificationSchema = z.object({
  ownerName: z.string().min(1),
  email: z.string().email(),
  locale: z.string().optional()
});

const activateWithCodeSchema = z.object({
  ownerName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  verificationCode: z.string().length(6),
  locale: z.string().optional()
});

// Enviar código de verificación por email
export const sendVerificationCode = async (req: Request, res: Response) => {
  try {
    const { ownerName, email, locale } = sendVerificationSchema.parse(req.body);
    
    // Generar código de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Guardar código en la base de datos (temporal)
    // Buscar o crear tenant temporal
    let tenant = await prisma.tenant.findFirst({
      where: { email }
    });
    
    if (!tenant) {
      const slug = `${ownerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      tenant = await prisma.tenant.create({
        data: {
          name: `${ownerName}'s Store`,
          slug,
          email,
          paymentStatus: 'pending',
          active: false,
          plan: 'free',
          emailVerificationCode: verificationCode,
          emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
          notes: ownerName // Guardar el nombre del dueño temporalmente
        }
      });
    } else {
      // Actualizar código existente
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          emailVerificationCode: verificationCode,
          emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
          notes: ownerName
        }
      });
    }
    
    // Enviar email con código
    const { sendVerificationEmail } = await import('../services/email.service');
    await sendVerificationEmail({
      to: email,
      ownerName,
      verificationCode,
      locale: locale || 'es'
    });
    
    console.log(`✅ Código de verificación enviado a ${email}: ${verificationCode}`);
    
    res.json({ 
      success: true, 
      message: 'Código de verificación enviado',
      // En desarrollo, devolver el código para testing
      ...(process.env.NODE_ENV === 'development' && { code: verificationCode })
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Error enviando código de verificación:', error);
    res.status(500).json({ error: 'Error al enviar código de verificación' });
  }
};

// Activar cuenta con código de verificación
export const activateWithCode = async (req: Request, res: Response) => {
  try {
    const { ownerName, email, password, verificationCode, locale } = activateWithCodeSchema.parse(req.body);
    
    // Buscar tenant por email
    const tenant = await prisma.tenant.findFirst({
      where: { email }
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Email no encontrado' });
    }
    
    // Verificar código
    if (!tenant.emailVerificationCode) {
      return res.status(400).json({ error: 'Código de verificación no encontrado. Solicita uno nuevo.' });
    }
    
    // Verificar expiración
    if (!tenant.emailVerificationExpires || new Date() > tenant.emailVerificationExpires) {
      return res.status(400).json({ error: 'El código ha expirado. Solicita uno nuevo.' });
    }
    
    // Verificar que el código coincida
    if (tenant.emailVerificationCode !== verificationCode) {
      return res.status(400).json({ error: 'Código de verificación incorrecto' });
    }
    
    // Código válido - Activar cuenta
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(password, 10);
    
    // Actualizar tenant
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        active: true,
        emailVerified: true,
        paymentStatus: 'trial', // 7 días de prueba
        nextPaymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 días
        emailVerificationCode: null,
        emailVerificationExpires: null
      }
    });
    
    // Crear usuario ADMIN para este tenant
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: ownerName,
        role: 'ADMIN',
        tenantId: tenant.id,
        active: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true
      }
    });
    
    console.log(`✅ Cuenta activada para ${email}`);
    
    res.json({
      success: true,
      message: 'Cuenta activada exitosamente',
      user,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        trialEndsAt: tenant.nextPaymentDate
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Error activando cuenta:', error);
    res.status(500).json({ error: 'Error al activar cuenta' });
  }
};

// Reenviar código de verificación
export const resendVerificationCode = async (req: Request, res: Response) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    
    // Buscar tenant
    const tenant = await prisma.tenant.findFirst({
      where: { email }
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Email no encontrado' });
    }
    
    const ownerName = tenant.notes || 'Usuario';
    
    // Generar nuevo código
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Actualizar código
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000)
      }
    });
    
    // Enviar email
    const { sendVerificationEmail } = await import('../services/email.service');
    await sendVerificationEmail({
      to: email,
      ownerName,
      verificationCode,
      locale: 'es'
    });
    
    console.log(`✅ Código reenviado a ${email}: ${verificationCode}`);
    
    res.json({ 
      success: true, 
      message: 'Código reenviado',
      ...(process.env.NODE_ENV === 'development' && { code: verificationCode })
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Error reenviando código:', error);
    res.status(500).json({ error: 'Error al reenviar código' });
  }
};

// ============================================
// ENDPOINTS DE RECUPERACIÓN DE CONTRASEÑA
// ============================================

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6)
});

// Solicitar recuperación de contraseña
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      // Por seguridad, no revelar si el email existe o no
      return res.json({ 
        success: true, 
        message: 'Si el email existe, recibirás un link de recuperación' 
      });
    }
    
    // Generar token único
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    
    // Guardar token en el usuario
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetTokenExpires
      }
    });
    
    // Generar link de recuperación
    const frontendUrl = process.env.FRONTEND_URL || 'https://app.mundoaple.store';
    const resetLink = `${frontendUrl}/restablecer-password/${resetToken}`;
    
    // Enviar email
    const { sendPasswordResetEmail } = await import('../services/email.service');
    await sendPasswordResetEmail({
      to: email,
      userName: user.name,
      resetLink
    });
    
    console.log(`✅ Email de recuperación enviado a ${email}`);
    console.log(`🔗 Reset link: ${resetLink}`);
    
    res.json({ 
      success: true, 
      message: 'Si el email existe, recibirás un link de recuperación',
      // En desarrollo, devolver el link para testing
      ...(process.env.NODE_ENV === 'development' && { resetLink })
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Email inválido', details: error.errors });
    }
    console.error('Error en forgot password:', error);
    res.status(500).json({ error: 'Error al procesar solicitud' });
  }
};

// Restablecer contraseña con token
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    
    // Buscar usuario por token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date() // Token no expirado
        }
      }
    });
    
    if (!user) {
      return res.status(400).json({ 
        error: 'Token inválido o expirado. Solicita un nuevo link de recuperación.' 
      });
    }
    
    // Hashear nueva contraseña
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.default.hash(password, 10);
    
    // Actualizar contraseña y limpiar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });
    
    console.log(`✅ Contraseña restablecida para ${user.email}`);
    
    res.json({ 
      success: true, 
      message: 'Contraseña restablecida exitosamente' 
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
    }
    console.error('Error en reset password:', error);
    res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
};
