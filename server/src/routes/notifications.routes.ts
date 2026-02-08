import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPreferences,
  updatePreferences,
  getWhatsAppNumbers,
  addWhatsAppNumber,
  updateWhatsAppNumber,
  deleteWhatsAppNumber,
} from '../controllers/notification.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Preferencias de notificaciones
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

// Números de WhatsApp
router.get('/whatsapp-numbers', getWhatsAppNumbers);
router.post('/whatsapp-numbers', addWhatsAppNumber);
router.patch('/whatsapp-numbers/:id', updateWhatsAppNumber);
router.delete('/whatsapp-numbers/:id', deleteWhatsAppNumber);

export default router;
