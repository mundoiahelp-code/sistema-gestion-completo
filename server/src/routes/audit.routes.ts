import { Router } from 'express';
import { getAuditLogs, getAuditStats, getUserActivity } from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Solo ADMIN y SUPER_ADMIN pueden ver el historial
router.get('/', authorize('ADMIN', 'SUPER_ADMIN'), getAuditLogs);
router.get('/stats', authorize('ADMIN', 'SUPER_ADMIN'), getAuditStats);
router.get('/user/:userId', authorize('ADMIN', 'SUPER_ADMIN'), getUserActivity);

export default router;
