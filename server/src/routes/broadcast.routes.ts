import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { requireFeature } from '../middleware/planFeatures';
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
// Broadcast requiere plan Basic o superior (integrations)
router.use(requireFeature('integrations'));

router.get('/channels', getChannels);
router.post('/channels', createChannel);
router.put('/channels/:id', updateChannel);
router.delete('/channels/:id', deleteChannel);
router.post('/channels/:id/send', sendToChannel);
router.get('/whatsapp-groups', getWhatsAppGroups);

export default router;
