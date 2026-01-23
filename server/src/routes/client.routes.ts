import { Router } from 'express';
import { getClients, getClient, createClient, updateClient, deleteClient } from '../controllers/client.controller';
import { authenticate } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/', getClients);
router.get('/:id', getClient);
router.post('/', auditLog('CREATE', 'CLIENT'), createClient);
router.put('/:id', auditLog('UPDATE', 'CLIENT'), updateClient);
router.delete('/:id', auditLog('DELETE', 'CLIENT'), deleteClient);

export default router;
