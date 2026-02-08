import { Router } from 'express';
import { 
  getProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  transferProduct, 
  lookupImei,
  lookupBarcode,
  reserveProduct,
  getPriceHistory,
  generateBarcode,
  getAccessoriesGrouped
} from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/', getProducts);
router.get('/accessories-grouped', getAccessoriesGrouped);
router.get('/imei/:imei', lookupImei);
router.get('/barcode/:barcode', lookupBarcode);
router.get('/:id', getProduct);
router.get('/:id/price-history', getPriceHistory);
router.post('/', authorize('ADMIN', 'MANAGER', 'SELLER'), auditLog('CREATE', 'PRODUCT'), createProduct);
router.post('/transfer', authorize('ADMIN', 'MANAGER'), auditLog('UPDATE', 'PRODUCT'), transferProduct);
router.post('/:id/barcode', authorize('ADMIN', 'MANAGER'), auditLog('UPDATE', 'PRODUCT'), generateBarcode);
router.patch('/reserve/:id', reserveProduct);
router.patch('/:id', authorize('ADMIN', 'MANAGER', 'SELLER'), auditLog('UPDATE', 'PRODUCT'), updateProduct);
router.put('/:id', authorize('ADMIN', 'MANAGER', 'SELLER'), auditLog('UPDATE', 'PRODUCT'), updateProduct);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), auditLog('DELETE', 'PRODUCT'), deleteProduct);

export default router;
