import { Router } from 'express';
import { getSales, getSale, createSale, updateSale, deleteSale, exportSalesToPDF } from '../controllers/sale.controller';
import { authenticate, authorize } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/export/pdf', exportSalesToPDF); // Exportar ventas nuevas - ANTES de /:id
router.get('/', getSales);
router.get('/:id', getSale);
router.post('/', auditLog('CREATE', 'SALE'), createSale);
router.put('/:id', authorize('ADMIN', 'MANAGER'), auditLog('UPDATE', 'SALE'), updateSale);
router.delete('/:id', authorize('ADMIN'), auditLog('DELETE', 'SALE'), deleteSale);

export default router;
