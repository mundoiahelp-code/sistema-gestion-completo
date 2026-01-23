import { Router } from 'express';
import { getStores, getStore, createStore, updateStore, deleteStore } from '../controllers/store.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getStores);
router.get('/:id', getStore);
router.post('/', authorize('ADMIN'), createStore);
router.put('/:id', authorize('ADMIN', 'MANAGER'), updateStore);
router.patch('/:id', authorize('ADMIN', 'MANAGER'), updateStore);
router.delete('/:id', authorize('ADMIN'), deleteStore);

export default router;
