import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createPayment,
  verifyPayment,
  getPaymentStatus,
  getPaymentHistory,
  mercadoPagoWebhook,
  createPublicPayment,
  verifyPublicPayment,
  getPublicPaymentStatus,
  createActivationToken,
  getActivationData,
  sendVerificationCode,
  activateWithCode,
  resendVerificationCode,
  forgotPassword,
  resetPassword
} from '../controllers/payment.controller';

const router = Router();

// Rutas públicas (para nuevos usuarios sin cuenta)
router.post('/public/create', createPublicPayment);
router.post('/public/verify', verifyPublicPayment);
router.get('/public/:id/status', getPublicPaymentStatus);

// Rutas de activación con código
router.post('/create-activation-token', createActivationToken);
router.get('/activation-data/:token', getActivationData);
router.post('/send-verification', sendVerificationCode);
router.post('/activate-with-code', activateWithCode);
router.post('/resend-verification', resendVerificationCode);

// Rutas de recuperación de contraseña
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Rutas protegidas (para usuarios con cuenta)
router.post('/', authenticate, createPayment);
router.post('/verify', authenticate, verifyPayment);
router.get('/:id', authenticate, getPaymentStatus);
router.get('/', authenticate, getPaymentHistory);

// Webhook público (sin autenticación)
router.post('/webhooks/mercadopago', mercadoPagoWebhook);

export default router;
