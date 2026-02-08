import { Router } from 'express';
import { 
  getTenants, 
  getTenant, 
  getCurrentTenant,
  createTenant, 
  updateTenant, 
  updateBotConfig,
  deleteTenant,
  activateTenant,
  deactivateTenant,
  deleteTenantPermanent,
  completeOnboarding,
  updateLocale,
  createTenantWithInvitation,
  validateInvitation,
  activateAccount,
  updateHiddenModels,
  updateHiddenCategories,
  updateTenantPlan,
  createBusinessInvitation,
  uploadCustomLogo,
  deleteCustomLogo
} from '../controllers/tenant.controller';
import { 
  getTenantPayments, 
  createTenantPayment, 
  updateTenantPrice 
} from '../controllers/tenant-payment.controller';
import { 
  getTenantAIStats, 
  toggleTenantAI, 
  getGlobalAIStats,
  getMonthlyRevenue
} from '../controllers/ai-stats.controller';
import { migrateFreeToTrial } from '../controllers/migration.controller';
import { authenticate, authorize } from '../middleware/auth';
import { authenticateBot } from '../middleware/botAuth';

const router = Router();

// Rutas públicas (sin autenticación) - para activación de cuenta
router.get('/validate-invitation/:token', validateInvitation);
router.post('/activate', activateAccount);

// Ruta pública para bots (autenticación por tenant ID)
router.get('/public/current', authenticateBot, getCurrentTenant);

// Todas las demás rutas requieren autenticación
router.use(authenticate);

// Rutas para el tenant actual (cualquier usuario autenticado)
router.get('/current', getCurrentTenant);
router.patch('/current/bot', authorize('ADMIN', 'MANAGER'), updateBotConfig);
router.patch('/current/locale', authorize('ADMIN'), updateLocale);
router.patch('/current/hidden-models', authorize('ADMIN'), updateHiddenModels);
router.patch('/current/hidden-categories', authorize('ADMIN'), updateHiddenCategories);
router.post('/current/onboarding', authorize('ADMIN'), completeOnboarding);
router.post('/current/logo', authorize('ADMIN'), uploadCustomLogo);
router.delete('/current/logo', authorize('ADMIN'), deleteCustomLogo);

// Rutas de estadísticas de IA (solo SUPER_ADMIN) - ANTES de las rutas con :id
router.get('/ai-stats/global', authorize('SUPER_ADMIN'), getGlobalAIStats);
router.get('/revenue/monthly', authorize('SUPER_ADMIN'), getMonthlyRevenue);
router.post('/migrate-free-to-trial', authorize('SUPER_ADMIN'), migrateFreeToTrial);

// Rutas para SUPER_ADMIN (gestión de todos los tenants)
router.get('/', authorize('SUPER_ADMIN'), getTenants);
router.post('/', authorize('SUPER_ADMIN'), createTenant);
router.post('/invite', authorize('SUPER_ADMIN'), createTenantWithInvitation);
router.post('/create-invitation', authorize('SUPER_ADMIN'), createBusinessInvitation);

// Rutas específicas de tenant (con :id o :tenantId) - DESPUÉS de las rutas fijas
router.get('/:tenantId/payments', authorize('SUPER_ADMIN'), getTenantPayments);
router.post('/:tenantId/payments', authorize('SUPER_ADMIN'), createTenantPayment);
router.patch('/:tenantId/price', authorize('SUPER_ADMIN'), updateTenantPrice);
router.get('/:tenantId/ai-stats', authorize('SUPER_ADMIN'), getTenantAIStats);
router.patch('/:tenantId/ai-toggle', authorize('SUPER_ADMIN'), toggleTenantAI);
router.patch('/:id/activate', authorize('SUPER_ADMIN'), activateTenant);
router.patch('/:id/deactivate', authorize('SUPER_ADMIN'), deactivateTenant);
router.patch('/:id/plan', authorize('SUPER_ADMIN'), updateTenantPlan);
router.delete('/:id/permanent', authorize('SUPER_ADMIN'), deleteTenantPermanent);
router.delete('/:id', authorize('SUPER_ADMIN'), deleteTenant);

// Rutas para gestión de tenants (ADMIN puede ver/editar su tenant, SUPER_ADMIN puede editar cualquiera)
router.get('/:id', authorize('ADMIN', 'SUPER_ADMIN'), getTenant);
router.patch('/:id', authorize('ADMIN', 'SUPER_ADMIN'), updateTenant);

export default router;
