import { Response, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
// import { sendWelcomeEmail } from '../services/email.service'; // Comentado - función no existe

const tenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  logo: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  website: z.string().optional(),
  instagram: z.string().optional(),
  whatsapp: z.string().optional(),
  whatsappAsesor: z.string().optional(),
  currency: z.string().optional(),
  timezone: z.string().optional(),
  // Gestión de suscripción
  plan: z.string().optional(),
  planPrice: z.number().optional(),
  planStartDate: z.string().optional(),
  planExpires: z.string().optional(),
  paymentMethod: z.string().optional(),
  lastPaymentDate: z.string().optional(),
  nextPaymentDate: z.string().optional(),
  paymentStatus: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
  // Bot config
  botEnabled: z.boolean().optional(),
  botTone: z.string().optional(),
  botLanguage: z.string().optional(),
  botGreeting: z.string().optional(),
  botFarewell: z.string().optional(),
  botExtraInfo: z.string().optional(),
  botWarrantyDays: z.number().optional(),
  botShipsOrders: z.boolean().optional(),
  botPaymentMethods: z.string().optional(),
  botWorkingHours: z.string().optional(),
  botLocation: z.string().optional(),
  // Info adicional
  shippingZones: z.string().optional(),
  shippingTime: z.string().optional(),
  returnPolicy: z.string().optional(),
  reservationDeposit: z.string().optional(),
});

// Obtener todos los tenants (solo SUPER_ADMIN)
export const getTenants = async (req: AuthRequest, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: { 
            users: true, 
            stores: true, 
            products: true,
            sales: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tenants);
  } catch (error) {
    console.error('Error getting tenants:', error);
    res.status(400).json({ error: 'Error al obtener tenants' });
  }
};

// Obtener tenant actual (para el usuario logueado)
export const getCurrentTenant = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: { users: true, stores: true, products: true }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }

    res.json({ tenant });
  } catch (error) {
    console.error('Error getting current tenant:', error);
    res.status(400).json({ error: 'Error al obtener tenant' });
  }
};

// Obtener tenant por ID
export const getTenant = async (req: AuthRequest, res: Response) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.params.id },
      include: {
        stores: { where: { active: true } },
        _count: {
          select: { users: true, stores: true, products: true, sales: true }
        }
      }
    });

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' });
    }

    res.json({ tenant });
  } catch (error) {
    console.error('Error getting tenant:', error);
    res.status(400).json({ error: 'Error al obtener tenant' });
  }
};

// Crear nuevo tenant con usuario admin
export const createTenant = async (req: AuthRequest, res: Response) => {
  try {
    const { adminEmail, adminPassword, adminName, locale, ...tenantData } = req.body;
    const data = tenantSchema.parse(tenantData);

    // Verificar que el slug no exista
    const existingSlug = await prisma.tenant.findUnique({
      where: { slug: data.slug }
    });
    
    if (existingSlug) {
      return res.status(400).json({ error: 'El slug ya está en uso' });
    }

    // Verificar que el email del admin no exista
    if (adminEmail) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: adminEmail }
      });
      
      if (existingEmail) {
        return res.status(400).json({ error: 'El email del admin ya está en uso' });
      }
    }

    // Crear tenant y usuario admin en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear tenant
      const tenant = await tx.tenant.create({
        data: {
          ...data,
          locale: locale || 'es',
          planStartDate: data.planStartDate ? new Date(data.planStartDate) : new Date(),
          planExpires: data.planExpires ? new Date(data.planExpires) : null,
          lastPaymentDate: data.lastPaymentDate ? new Date(data.lastPaymentDate) : null,
          nextPaymentDate: data.nextPaymentDate ? new Date(data.nextPaymentDate) : null,
        }
      });

      // Crear usuario admin si se proporcionaron datos
      let adminUser = null;
      if (adminEmail && adminPassword) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        adminUser = await tx.user.create({
          data: {
            email: adminEmail,
            password: hashedPassword,
            name: adminName || 'Administrador',
            role: 'ADMIN',
            tenantId: tenant.id
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        });
      }

      // Crear sucursal por defecto
      await tx.store.create({
        data: {
          name: 'Sucursal Principal',
          tenantId: tenant.id
        }
      });

      return { tenant, adminUser };
    });

    // Enviar email de bienvenida si se creó un admin (comentado - función no existe)
    // if (adminEmail && adminPassword) {
    //   sendWelcomeEmail({
    //     to: adminEmail,
    //     businessName: data.name,
    //     adminName: adminName || 'Administrador',
    //     adminEmail,
    //     adminPassword, // Enviamos la contraseña original, no la hasheada
    //     locale: locale || 'es'
    //   }).catch(err => console.error('Error enviando email de bienvenida:', err));
    // }

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Error creating tenant:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El slug o email ya está en uso' });
    }
    res.status(400).json({ error: 'Error al crear tenant' });
  }
};

// Actualizar tenant (solo el propio tenant o SUPER_ADMIN)
export const updateTenant = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const data = tenantSchema.partial().parse(req.body);

    // Verificar permisos (solo puede editar su propio tenant o ser super admin)
    if (id !== tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'No tienes permisos para editar este tenant' });
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        ...data,
        planStartDate: data.planStartDate ? new Date(data.planStartDate) : undefined,
        planExpires: data.planExpires ? new Date(data.planExpires) : undefined,
        lastPaymentDate: data.lastPaymentDate ? new Date(data.lastPaymentDate) : undefined,
        nextPaymentDate: data.nextPaymentDate ? new Date(data.nextPaymentDate) : undefined,
      }
    });

    res.json({ tenant });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(400).json({ error: 'Error al actualizar tenant' });
  }
};

// Actualizar configuración del bot del tenant actual
export const updateBotConfig = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const {
      botEnabled,
      botTone,
      botLanguage,
      botGreeting,
      botFarewell,
      botExtraInfo,
      botWarrantyDays,
      botShipsOrders,
      botPaymentMethods,
      botWorkingHours,
      botLocation
    } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        botEnabled,
        botTone,
        botLanguage,
        botGreeting,
        botFarewell,
        botExtraInfo,
        botWarrantyDays,
        botShipsOrders,
        botPaymentMethods,
        botWorkingHours,
        botLocation
      }
    });

    res.json({ tenant, message: 'Configuración del bot actualizada' });
  } catch (error) {
    console.error('Error updating bot config:', error);
    res.status(400).json({ error: 'Error al actualizar configuración del bot' });
  }
};

// Desactivar tenant (solo SUPER_ADMIN)
export const deleteTenant = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.tenant.update({
      where: { id: req.params.id },
      data: { active: false }
    });

    res.json({ message: 'Tenant desactivado' });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(400).json({ error: 'Error al desactivar tenant' });
  }
};

// Activar tenant (solo SUPER_ADMIN)
export const activateTenant = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.tenant.update({
      where: { id: req.params.id },
      data: { active: true }
    });

    res.json({ message: 'Tenant activado' });
  } catch (error) {
    console.error('Error activating tenant:', error);
    res.status(400).json({ error: 'Error al activar tenant' });
  }
};

// Desactivar tenant (solo SUPER_ADMIN)
export const deactivateTenant = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.tenant.update({
      where: { id: req.params.id },
      data: { active: false }
    });

    res.json({ message: 'Tenant desactivado' });
  } catch (error) {
    console.error('Error deactivating tenant:', error);
    res.status(400).json({ error: 'Error al desactivar tenant' });
  }
};

// Eliminar tenant permanentemente (solo SUPER_ADMIN)
export const deleteTenantPermanent = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.params.id;

    console.log(`🗑️ Iniciando eliminación permanente del tenant: ${tenantId}`);

    // Eliminar en orden para respetar foreign keys
    await prisma.$transaction(async (tx) => {
      // 1. Eliminar logs de auditoría
      console.log('  Eliminando logs de auditoría...');
      await tx.auditLog.deleteMany({ where: { tenantId } });
      
      // 2. Eliminar configuraciones del bot
      console.log('  Eliminando configuraciones del bot...');
      await tx.botConfig.deleteMany({ where: { tenantId } });
      
      // 3. Eliminar mensajes de chat
      console.log('  Eliminando mensajes de chat...');
      await tx.chatMessage.deleteMany({ where: { tenantId } });
      
      // 4. Eliminar items de venta
      console.log('  Eliminando items de venta...');
      await tx.saleItem.deleteMany({ where: { sale: { tenantId } } });
      
      // 5. Eliminar ventas
      console.log('  Eliminando ventas...');
      await tx.sale.deleteMany({ where: { tenantId } });
      
      // 6. Eliminar items de orden
      console.log('  Eliminando items de orden...');
      await tx.orderItem.deleteMany({ where: { order: { tenantId } } });
      
      // 7. Eliminar órdenes
      console.log('  Eliminando órdenes...');
      await tx.order.deleteMany({ where: { tenantId } });
      
      // 8. Eliminar historial de precios
      console.log('  Eliminando historial de precios...');
      await tx.priceHistory.deleteMany({ where: { product: { tenantId } } });
      
      // 9. Eliminar turnos
      console.log('  Eliminando turnos...');
      await tx.appointment.deleteMany({ where: { tenantId } });
      
      // 10. Eliminar reparaciones
      console.log('  Eliminando reparaciones...');
      await tx.repair.deleteMany({ where: { tenantId } });
      
      // 11. Eliminar fotos de productos
      console.log('  Eliminando fotos de productos...');
      await tx.productPhoto.deleteMany({ where: { tenantId } });
      
      // 12. Eliminar productos
      console.log('  Eliminando productos...');
      await tx.product.deleteMany({ where: { tenantId } });
      
      // 13. Eliminar canales de broadcast
      console.log('  Eliminando canales de broadcast...');
      await tx.broadcastChannel.deleteMany({ where: { tenantId } });
      
      // 14. Eliminar números de notificación
      console.log('  Eliminando números de notificación...');
      await tx.whatsAppNotificationNumber.deleteMany({ where: { tenantId } });
      
      // 15. Eliminar preferencias de notificación de usuarios
      console.log('  Eliminando preferencias de notificación...');
      await tx.notificationPreferences.deleteMany({ where: { user: { tenantId } } });
      
      // 16. Eliminar clientes
      console.log('  Eliminando clientes...');
      await tx.client.deleteMany({ where: { tenantId } });
      
      // 17. Eliminar usuarios
      console.log('  Eliminando usuarios...');
      await tx.user.deleteMany({ where: { tenantId } });
      
      // 18. Eliminar sucursales
      console.log('  Eliminando sucursales...');
      await tx.store.deleteMany({ where: { tenantId } });
      
      // 19. Finalmente eliminar el tenant
      console.log('  Eliminando tenant...');
      await tx.tenant.delete({ where: { id: tenantId } });
      
      console.log('✅ Tenant eliminado exitosamente');
    });

    res.json({ message: 'Tenant eliminado permanentemente' });
  } catch (error) {
    console.error('❌ Error deleting tenant permanently:', error);
    res.status(400).json({ error: 'Error al eliminar tenant', details: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Completar onboarding inicial
export const completeOnboarding = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const {
      name,
      whatsapp,
      whatsappAsesor,
      instagram,
      website,
      botPaymentMethods,
      botWarrantyDays,
      botShipsOrders,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Business name is required' });
    }

    // Actualizar tenant
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name,
        whatsapp: whatsapp || null,
        whatsappAsesor: whatsappAsesor || null,
        instagram: instagram || null,
        website: website || null,
        botPaymentMethods: botPaymentMethods || 'cash,transfer',
        botWarrantyDays: botWarrantyDays || 30,
        botShipsOrders: botShipsOrders || false,
        onboardingCompleted: true
      }
    });

    // Asignar la primera sucursal al usuario si no tiene una
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { storeId: true }
    });

    if (!user?.storeId) {
      const firstStore = await prisma.store.findFirst({
        where: { tenantId, active: true },
        orderBy: { createdAt: 'asc' }
      });

      if (firstStore) {
        await prisma.user.update({
          where: { id: userId },
          data: { storeId: firstStore.id }
        });
      }
    }

    res.json({ tenant, message: 'Onboarding completed' });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(400).json({ error: 'Error completing onboarding' });
  }
};

// Actualizar locale del tenant (idioma del sistema)
export const updateLocale = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { locale } = req.body;

    if (!locale || !['es', 'en'].includes(locale)) {
      return res.status(400).json({ error: 'Invalid locale. Must be "es" or "en"' });
    }

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { locale }
    });

    res.json({ tenant, message: 'Locale updated' });
  } catch (error) {
    console.error('Error updating locale:', error);
    res.status(400).json({ error: 'Error updating locale' });
  }
};

// Cargar configuración del sistema
const loadSystemConfig = () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const CONFIG_FILE = path.join(__dirname, '../../system-config.json');
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading system config:', err);
  }
  return null;
};

// Crear tenant con invitación (sin usuario admin - el cliente lo crea después)
export const createTenantWithInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { ownerName, planPrice, locale, notes } = req.body;

    if (!ownerName) {
      return res.status(400).json({ error: 'El nombre del dueño es requerido' });
    }

    // Generar token único de invitación
    const invitationToken = require('crypto').randomBytes(32).toString('hex');
    const slug = ownerName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14); // 14 días de trial

    // Crear tenant sin usuario
    const tenant = await prisma.tenant.create({
      data: {
        name: `Negocio de ${ownerName}`,
        slug,
        locale: locale || 'es',
        plan: 'trial',
        planPrice: planPrice || 0,
        planStartDate: now,
        planExpires: trialEnd, // Fecha de expiración del trial
        nextPaymentDate: trialEnd,
        notes: notes || null,
        invitationToken,
        active: true,
        onboardingCompleted: false,
      }
    });

    // Crear sucursal por defecto
    await prisma.store.create({
      data: {
        name: 'Sucursal Principal',
        tenantId: tenant.id
      }
    });

    // Generar link de invitación usando la configuración del sistema
    const config = loadSystemConfig();
    const frontendUrl = config?.system?.systemUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
    const invitationLink = `${frontendUrl}/activar/${invitationToken}`;

    res.status(201).json({ 
      tenant, 
      invitationLink,
      message: 'Negocio creado. Compartí el link de invitación con el cliente.'
    });
  } catch (error: any) {
    console.error('Error creating tenant with invitation:', error);
    res.status(400).json({ error: 'Error al crear negocio' });
  }
};

// Validar token de invitación
export const validateInvitation = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { invitationToken: token },
      select: {
        id: true,
        name: true,
        locale: true,
        planPrice: true,
        invitationToken: true,
      }
    });

    if (!tenant || !tenant.invitationToken) {
      return res.status(404).json({ error: 'Token inválido o ya utilizado' });
    }

    // Verificar que no tenga usuarios (no fue activado)
    const usersCount = await prisma.user.count({
      where: { tenantId: tenant.id }
    });

    const hasAdmin = usersCount > 0;

    if (hasAdmin) {
      return res.status(400).json({ error: 'Esta cuenta ya fue activada' });
    }

    res.json({ tenant, hasAdmin });
  } catch (error) {
    console.error('Error validating invitation:', error);
    res.status(400).json({ error: 'Error al validar invitación' });
  }
};

// Activar cuenta con token de invitación
export const activateAccount = async (req: Request, res: Response) => {
  try {
    const { token, email, password, name } = req.body;

    if (!token || !email || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Buscar tenant por token
    const tenant = await prisma.tenant.findUnique({
      where: { invitationToken: token }
    });

    if (!tenant || !tenant.invitationToken) {
      return res.status(404).json({ error: 'Token inválido o ya utilizado' });
    }

    // Verificar que el email no exista
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está en uso' });
    }

    // Crear usuario admin y limpiar token
    const hashedPassword = await bcrypt.hash(password, 10);

    const [user, updatedTenant] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'ADMIN',
          tenantId: tenant.id,
          active: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        }
      }),
      prisma.tenant.update({
        where: { id: tenant.id },
        data: { 
          name: `Negocio de ${name}`, // Actualizar nombre del tenant con el nombre del usuario
          invitationToken: null, // Limpiar token para que no se pueda usar de nuevo
        }
      })
    ]);

    // Enviar email de bienvenida (comentado - función no existe)
    // sendWelcomeEmail({
    //   to: email,
    //   businessName: tenant.name,
    //   adminName: name,
    //   adminEmail: email,
    //   adminPassword: password,
    //   locale: tenant.locale || 'es'
    // }).catch(err => console.error('Error enviando email de bienvenida:', err));

    console.log('✅ Cuenta activada exitosamente para:', email);

    res.json({ 
      success: true, 
      user,
      message: 'Cuenta activada exitosamente' 
    });
  } catch (error) {
    console.error('Error activating account:', error);
    res.status(400).json({ error: 'Error al activar cuenta' });
  }
};


// Actualizar modelos ocultos del tenant
export const updateHiddenModels = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { hiddenModels } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { 
        hiddenModels: JSON.stringify(hiddenModels || [])
      }
    });

    res.json({ tenant, message: 'Hidden models updated' });
  } catch (error) {
    console.error('Error updating hidden models:', error);
    res.status(400).json({ error: 'Error updating hidden models' });
  }
};

// Actualizar categorías de accesorios ocultas del tenant
export const updateHiddenCategories = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    const { hiddenCategories } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { 
        hiddenCategories: JSON.stringify(hiddenCategories || [])
      }
    });

    res.json({ tenant, message: 'Hidden categories updated' });
  } catch (error) {
    console.error('Error updating hidden categories:', error);
    res.status(400).json({ error: 'Error updating hidden categories' });
  }
};

// Cambiar plan de un tenant (solo SUPER_ADMIN)
export const updateTenantPlan = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;

    if (!plan || !['trial', 'basic', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ error: 'Plan inválido. Debe ser: trial, basic, pro o enterprise' });
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: { plan }
    });

    res.json({ tenant, message: `Plan actualizado a ${plan}` });
  } catch (error) {
    console.error('Error updating tenant plan:', error);
    res.status(400).json({ error: 'Error al actualizar plan' });
  }
};


// Crear invitación para nuevo negocio (SUPER_ADMIN)
export const createBusinessInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { businessName, ownerName, email, phone, plan, locale } = req.body;

    if (!businessName || !ownerName || !email) {
      return res.status(400).json({ error: 'Nombre del negocio, dueño y email son requeridos' });
    }

    // Verificar si ya existe un tenant con ese email
    const existingTenant = await prisma.tenant.findFirst({
      where: { email }
    });

    if (existingTenant) {
      return res.status(400).json({ error: 'Ya existe un negocio con ese email' });
    }

    // Generar slug único
    const slug = businessName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14); // 14 días de trial

    // Crear tenant temporal (inactivo hasta que active su cuenta)
    const tenant = await prisma.tenant.create({
      data: {
        name: businessName,
        slug,
        email,
        phone: phone || null,
        plan: plan || 'trial',
        planStartDate: now,
        planExpires: trialEnd, // Fecha de expiración del trial
        nextPaymentDate: trialEnd,
        paymentStatus: 'pending',
        active: false, // Inactivo hasta que active
        onboardingCompleted: false,
        notes: ownerName, // Guardar nombre del dueño temporalmente
        locale: locale || 'es', // Guardar idioma seleccionado
      }
    });

    // Crear sucursal por defecto
    await prisma.store.create({
      data: {
        name: 'Sucursal Principal',
        tenantId: tenant.id
      }
    });

    console.log(`✅ Invitación creada para ${businessName} (${email}) - Idioma: ${locale || 'es'}`);

    res.status(201).json({ 
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        plan: tenant.plan,
        locale: tenant.locale
      },
      message: 'Invitación creada exitosamente'
    });
  } catch (error: any) {
    console.error('Error creating business invitation:', error);
    res.status(400).json({ error: 'Error al crear invitación' });
  }
};

// Subir logo personalizado
export const uploadCustomLogo = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant no encontrado' });
    }

    // El logo viene como base64 en el body
    const { logo } = req.body;
    
    if (!logo) {
      return res.status(400).json({ error: 'Logo requerido' });
    }

    // Actualizar tenant con el logo
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { customLogo: logo }
    });

    res.json({ 
      message: 'Logo actualizado exitosamente',
      customLogo: tenant.customLogo
    });
  } catch (error) {
    console.error('Error subiendo logo:', error);
    res.status(500).json({ error: 'Error al subir logo' });
  }
};

// Eliminar logo personalizado
export const deleteCustomLogo = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant no encontrado' });
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { customLogo: null }
    });

    res.json({ message: 'Logo eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando logo:', error);
    res.status(500).json({ error: 'Error al eliminar logo' });
  }
};
