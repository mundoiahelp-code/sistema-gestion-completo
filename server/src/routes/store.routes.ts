import { Router } from 'express';
import { getStores, getStore, createStore, updateStore, deleteStore } from '../controllers/store.controller';
import { authenticate, authorize } from '../middleware/auth';
import { checkStoreLimit } from '../middleware/planLimits';

const router = Router();

router.use(authenticate);

router.get('/', getStores);
router.get('/:id', getStore);
// ADMIN, MANAGER y SELLER pueden gestionar sucursales
router.post('/', authorize('ADMIN', 'MANAGER', 'SELLER'), checkStoreLimit, createStore);
router.put('/:id', authorize('ADMIN', 'MANAGER', 'SELLER'), updateStore);
router.patch('/:id', authorize('ADMIN', 'MANAGER', 'SELLER'), updateStore);
router.delete('/:id', authorize('ADMIN', 'MANAGER', 'SELLER'), deleteStore);

export default router;
