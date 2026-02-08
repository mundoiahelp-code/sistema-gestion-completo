import { Router } from 'express';
import { getOrders, getOrder, createOrder, updateOrder, deleteOrder } from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/', getOrders);
router.get('/:id', getOrder);
router.post('/', auditLog('CREATE', 'ORDER'), createOrder);
router.put('/:id', authorize('ADMIN', 'MANAGER'), auditLog('UPDATE', 'ORDER'), updateOrder);
router.delete('/:id', authorize('ADMIN'), auditLog('DELETE', 'ORDER'), deleteOrder);

export default router;
