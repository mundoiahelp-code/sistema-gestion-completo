import { Router } from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser, updateMyAccount, changePassword, updateAvatarColor } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { checkUserLimit } from '../middleware/planLimits';

const router = Router();

router.use(authenticate);

// Rutas para el usuario actual (settings)
router.patch('/settings/account', auditLog('UPDATE', 'USER'), updateMyAccount);
router.patch('/settings/password', auditLog('UPDATE', 'USER'), changePassword);
router.patch('/settings/avatar-color', auditLog('UPDATE', 'USER'), updateAvatarColor);

// Rutas de administración (solo ADMIN)
router.get('/', authorize('ADMIN'), getUsers);
router.get('/:id', authorize('ADMIN'), getUser);
router.post('/', authorize('ADMIN'), checkUserLimit, auditLog('CREATE', 'USER'), createUser);
router.put('/:id', authorize('ADMIN'), auditLog('UPDATE', 'USER'), updateUser);
router.delete('/:id', authorize('ADMIN'), auditLog('DELETE', 'USER'), deleteUser);

export default router;
