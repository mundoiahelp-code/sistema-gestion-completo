import { Router } from 'express';
import { getStores, getStore, createStore, updateStore, deleteStore } from '../controllers/store.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getStores);
router.get('/:id', getStore);
router.post('/', authorize('ADMIN', 'MANAGER', 'SELLER'), createStore);
router.put('/:id', authorize('ADMIN', 'MANAGER', 'SELLER'), updateStore);
router.patch('/:id', authorize('ADMIN', 'MANAGER', 'SELLER'), updateStore);
router.delete('/:id', authorize('ADMIN'), deleteStore);

export default router;
