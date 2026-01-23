import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  getSystemConfig, 
  updateSystemConfig, 
  testEmail,
  setupSystem,
  previewEmail
} from '../controllers/system.controller';

const router = Router();

// Ruta pública para inicializar el sistema (solo funciona si no hay usuarios)
router.post('/setup', setupSystem);

// Preview de emails (solo desarrollo)
router.get('/preview-email/:type', previewEmail);

// Todas las rutas requieren autenticación y ser SUPER_ADMIN
router.get('/config', authenticate, getSystemConfig);
router.put('/config', authenticate, updateSystemConfig);
router.post('/test-email', authenticate, testEmail);

export default router;
