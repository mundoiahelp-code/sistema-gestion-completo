import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { 
  getBlockedTimeSlots, 
  createBlockedTimeSlot, 
  deleteBlockedTimeSlot 
} from '../controllers/blockedTimeSlot.controller';

const router = Router();

router.use(authenticate);

router.get('/', getBlockedTimeSlots);
router.post('/', authorize('ADMIN', 'MANAGER'), createBlockedTimeSlot);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteBlockedTimeSlot);

export default router;
