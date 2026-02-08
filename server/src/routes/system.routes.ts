import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  getSystemConfig, 
  updateSystemConfig, 
  sendMassEmail,
  getActivityLogs,
  getTenantLogs,
} from '../controllers/systemConfig.controller';

const router = Router();

// Todas las rutas requieren autenticación y ser SUPERADMIN
router.get('/config', authenticate, getSystemConfig);
router.put('/config/:section', authenticate, updateSystemConfig);
router.post('/mass-email', authenticate, sendMassEmail);
router.get('/activity-logs', authenticate, getActivityLogs);
router.get('/logs/:tenantId', authenticate, getTenantLogs);

export default router;
