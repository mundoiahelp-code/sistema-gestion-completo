import { Router } from 'express';
import {
  getSystemConfig,
  updateSystemConfig,
  sendMassEmail,
  getActivityLogs,
  getTenantLogs,
} from '../controllers/systemConfig.controller';

const router = Router();

// Obtener configuración
router.get('/', getSystemConfig);

// Actualizar sección de configuración
router.put('/:section', updateSystemConfig);

// Enviar email masivo
router.post('/mass-email', sendMassEmail);

// Obtener logs de actividad
router.get('/logs', getActivityLogs);

// Obtener logs de un tenant específico
router.get('/logs/:tenantId', getTenantLogs);

export default router;
