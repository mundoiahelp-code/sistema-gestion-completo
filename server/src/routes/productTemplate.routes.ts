import { Router } from 'express';
import {
  getProductTemplates,
  createProductTemplate,
  updateProductTemplate,
  deleteProductTemplate,
} from '../controllers/productTemplate.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getProductTemplates);
router.post('/', authorize('ADMIN', 'MANAGER'), createProductTemplate);
router.patch('/:id', authorize('ADMIN', 'MANAGER'), updateProductTemplate);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteProductTemplate);

export default router;
