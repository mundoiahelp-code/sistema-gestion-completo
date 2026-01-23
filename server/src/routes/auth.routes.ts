import { Router } from 'express';
import { login, register, logout, me, verifyPassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.post('/verify-password', authenticate, verifyPassword);

export default router;
