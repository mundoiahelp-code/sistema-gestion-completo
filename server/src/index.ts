// Backend del Sistema de Gestión - v1.0.1
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { authenticate, checkSubscription } from './middleware/auth';
import { generalLimiter, tenantLimiter, authLimiter } from './middleware/rateLimiter';
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
import blockedTimeSlotRoutes from './routes/blockedTimeSlot.routes';
import { whatsappService } from './services/whatsapp.service';
import { broadcastService } from './services/broadcast.service';
import { instagramService } from './services/instagram.service';
import { appointmentReminderService } from './services/appointmentReminder.service';
import { auditCleanupService } from './services/auditCleanup.service';
import { paymentVerificationService } from './services/payment-verification.service';
import { backupService } from './services/backup.service';
import path from 'path';

import { ensureTenantIsolation } from './middleware/tenantIsolation';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

// Trust proxy - necesario para Railway/Vercel
app.set('trust proxy', 1);

// CORS - Configuración segura
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
  'https://app.clodeb.com',
  'https://clodeb.com',
  'https://www.clodeb.com',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    // Verificar si el origin está en la lista permitida o es un subdominio de clodeb.com
    if (allowedOrigins.includes(origin) || origin.endsWith('.clodeb.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-ID'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 horas
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Rate limiting ya no se define aquí - se usa el importado

// Seguridad HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    } : false, // Desactivado solo en desarrollo
  })
);

// Compresión gzip - respuestas más rápidas
app.use(compression());

// Rate limiting general (aplicar a todas las rutas API)
app.use('/api/', generalLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Middleware de tenant isolation (después de auth, antes de rutas)
// Se aplicará automáticamente a todas las rutas que usen authenticate
app.use('/api/', ensureTenantIsolation);

// Rutas
// Auth con rate limiting estricto
app.use('/api/auth', authLimiter, authRoutes);

// Aplicar checkSubscription y tenantLimiter a todas las rutas excepto auth y públicas
app.use('/api/users', authenticate, checkSubscription, tenantLimiter, userRoutes);
app.use('/api/stores', authenticate, checkSubscription, tenantLimiter, storeRoutes);
app.use('/api/products', authenticate, checkSubscription, tenantLimiter, productRoutes);
app.use('/api/clients', authenticate, checkSubscription, tenantLimiter, clientRoutes);
app.use('/api/sales', authenticate, checkSubscription, tenantLimiter, saleRoutes);
app.use('/api/orders', authenticate, checkSubscription, tenantLimiter, orderRoutes);
app.use('/api/dashboard', authenticate, checkSubscription, tenantLimiter, dashboardRoutes);
app.use('/api/whatsapp', whatsappRoutes); // Ya tiene authenticate interno
app.use('/api/instagram', instagramRoutes);
app.use('/api/appointments', authenticate, checkSubscription, appointmentRoutes);
app.use('/api/bot', botRoutes); // Ya tiene authenticate interno
app.use('/api/notifications', authenticate, checkSubscription, notificationRoutes);
app.use('/api/product-photos', authenticate, checkSubscription, productPhotoRoutes);
app.use('/api/broadcast', broadcastRoutes); // Ya tiene authenticate interno
app.use('/api/product-templates', authenticate, checkSubscription, productTemplateRoutes);
app.use('/api/tenants', tenantRoutes); // Tiene su propia auth
app.use('/api/system', systemRoutes);
app.use('/api/payments', authenticate, checkSubscription, paymentRoutes);
app.use('/api/audit', authenticate, checkSubscription, auditRoutes);
app.use('/api/test', testRoutes);
app.use('/api/blocked-time-slots', authenticate, checkSubscription, blockedTimeSlotRoutes);

// Servir archivos estáticos (fotos de productos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server running' });
});

// Endpoint temporal para crear admin - SOLO DESARROLLO
app.post('/api/create-admin-temp', async (req, res) => {
  // SEGURIDAD: Solo permitir en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Endpoint no disponible en producción' });
  }
  
  try {
    const { PrismaClient } = await import('@prisma/client');
    const bcrypt = await import('bcryptjs');
    const prisma = new PrismaClient();
    
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return res.status(400).json({ error: 'No hay tenants' });
    }
    
    const store = await prisma.store.findFirst({ where: { tenantId: tenant.id } });
    if (!store) {
      return res.status(400).json({ error: 'No hay tiendas' });
    }
    
    const hashedPassword = await bcrypt.default.hash('Lauti10b12RR!!', 10);
    const user = await prisma.user.upsert({
      where: { email: 'contacto@clodeb.com' },
      update: {
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        active: true
      },
      create: {
        email: 'contacto@clodeb.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        tenantId: tenant.id,
        storeId: store.id,
        active: true
      }
    });
    
    await prisma.$disconnect();
    
    res.json({ 
      success: true, 
      message: 'Admin creado',
      email: 'contacto@clodeb.com',
      password: 'Lauti10b12RR!!'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
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
  // TEMPORALMENTE DESHABILITADO - Esperando migración de DB
  // appointmentReminderService.start();
  
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
