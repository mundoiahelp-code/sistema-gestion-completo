import { Router } from 'express';
import { login, register, logout, me, verifyPassword, refreshAccessToken, updateProfile, changePassword } from '../controllers/auth.controller';
import { setup2FA, verify2FA, disable2FA, get2FAStatus, regenerateBackupCodes } from '../controllers/twoFactor.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.post('/refresh', refreshAccessToken);
router.get('/me', authenticate, me);
router.post('/verify-password', authenticate, verifyPassword);
router.patch('/update-profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);

// Rutas de 2FA
router.post('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/verify', authenticate, verify2FA);
router.post('/2fa/disable', authenticate, disable2FA);
router.get('/2fa/status', authenticate, get2FAStatus);
router.post('/2fa/backup-codes', authenticate, regenerateBackupCodes);

export default router;
