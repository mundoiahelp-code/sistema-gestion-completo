import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  sendToChannel,
  getWhatsAppGroups,
} from '../controllers/broadcast.controller';

const router = Router();

router.use(authenticate);

router.get('/channels', getChannels);
router.post('/channels', createChannel);
router.put('/channels/:id', updateChannel);
router.delete('/channels/:id', deleteChannel);
router.post('/channels/:id/send', sendToChannel);
router.get('/whatsapp-groups', getWhatsAppGroups);

export default router;
