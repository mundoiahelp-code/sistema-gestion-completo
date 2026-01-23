import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getStatus,
  connect,
  disconnect,
  sendMessage,
  getUserInfo,
  verifyWebhook,
  handleWebhook,
} from '../controllers/instagram.controller';

const router = Router();

// Webhook routes (sin autenticación para que Meta pueda acceder)
router.get('/webhook', verifyWebhook);
router.post('/webhook', handleWebhook);

// Rutas protegidas
router.use(authenticate);

router.get('/status', getStatus);
router.post('/connect', connect);
router.post('/disconnect', disconnect);
router.post('/send', sendMessage);
router.get('/user/:userId', getUserInfo);

export default router;
