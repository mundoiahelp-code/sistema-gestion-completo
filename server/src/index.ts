import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import storeRoutes from './routes/store.routes';
import productRoutes from './routes/product.routes';
import clientRoutes from './routes/client.routes';
import saleRoutes from './routes/sale.routes';
import orderRoutes from './routes/order.routes';
import dashboardRoutes from './routes/dashboard.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import instagramRoutes from './routes/instagram.routes';
import appointmentRoutes from './routes/appointment.routes';
import botRoutes from './routes/bot.routes';
import notificationRoutes from './routes/notifications.routes';
import productPhotoRoutes from './routes/productPhoto.routes';
import broadcastRoutes from './routes/broadcast.routes';
import productTemplateRoutes from './routes/productTemplate.routes';
import tenantRoutes from './routes/tenant.routes';
import systemRoutes from './routes/system.routes';
import paymentRoutes from './routes/payment.routes';
import auditRoutes from './routes/audit.routes';
import testRoutes from './routes/test.routes';
import { whatsappService } from './services/whatsapp.service';
import { broadcastService } from './services/broadcast.service';
import { instagramService } from './services/instagram.service';
import { appointmentReminderService } from './services/appointmentReminder.service';
import { auditCleanupService } from './services/auditCleanup.service';
import { paymentVerificationService } from './services/payment-verification.service';
import { backupService } from './services/backup.service';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// Trust proxy - necesario para Railway/Vercel
app.set('trust proxy', 1);

// CORS PRIMERO - antes que cualquier otra cosa
app.use(cors({
  origin: true, // Permitir todos los orígenes en desarrollo
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 horas
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Rate limiting - protección contra abusos
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5000, // máximo 5000 requests por ventana (aumentado para desarrollo)
  message: { error: 'Demasiadas solicitudes, intenta más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // No aplicar rate limit en desarrollo
    return process.env.NODE_ENV === 'development';
  }
});

// Seguridad HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Desactivado para desarrollo
  })
);

// Compresión gzip - respuestas más rápidas
app.use(compression());

// Rate limiting (solo en producción)
if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/instagram', instagramRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/product-photos', productPhotoRoutes);
app.use('/api/broadcast', broadcastRoutes);
app.use('/api/product-templates', productTemplateRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/test', testRoutes);

// Servir archivos estáticos (fotos de productos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server running' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // MULTI-TENANT: No inicializar WhatsApp en el servidor principal
  // Cada tenant tiene su propio bot que maneja WhatsApp
  // whatsappService.initialize().catch(err => {
  //   console.log('⚠️ WhatsApp no inicializado:', err.message);
  // });
  
  // Iniciar broadcast scheduler
  broadcastService.start();
  
  // Iniciar servicio de recordatorios de turnos
  appointmentReminderService.start();
  
  // Iniciar servicio de limpieza de auditoría (elimina registros > 7 días)
  auditCleanupService.start();
  
  // Iniciar backup automático (diario a las 3:00 AM)
  backupService.startAutomaticBackups();
  
  // Iniciar verificación de pagos pendientes (cada 30 segundos)
  setInterval(() => {
    paymentVerificationService.verifyAllPendingPayments().catch(err => {
      console.error('Error en verificación de pagos:', err);
    });
  }, 30 * 1000); // 30 segundos
  console.log('💳 Payment verification service started (runs every 30 seconds)');
  
  // Instagram se inicializa cuando el usuario conecta su cuenta
  console.log('📸 Instagram service ready');
});
