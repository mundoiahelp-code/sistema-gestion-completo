import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getStatus,
  getQRCode,
  sendRepairMessage,
  sendMessage,
  logout,
  reconnect,
  getGroups,
} from '../controllers/whatsapp.controller';
import { whatsappService } from '../services/whatsapp.service';

const router = Router();

// Endpoint interno para chat-auto (sin auth, solo localhost)
router.post('/internal/send', async (req: Request, res: Response) => {
  try {
    const { phone, message } = req.body;
    
    if (!phone || !message) {
      return res.status(400).json({ success: false, error: 'phone y message son requeridos' });
    }
    
    console.log(`📤 Enviando mensaje interno a ${phone}...`);
    const sent = await whatsappService.sendMessage(phone, message);
    
    if (sent) {
      console.log(`✅ Mensaje interno enviado a ${phone}`);
      res.json({ success: true });
    } else {
      console.error(`❌ Error enviando mensaje interno a ${phone}`);
      res.status(500).json({ success: false, error: 'Error enviando mensaje' });
    }
  } catch (error) {
    console.error('❌ Error en /internal/send:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

// Todas las rutas siguientes requieren autenticación
router.use(authenticate);

router.get('/status', getStatus);
router.get('/qr', getQRCode);
router.get('/groups', getGroups);
router.post('/send-repair', sendRepairMessage);
router.post('/send', sendMessage);
router.post('/logout', logout);
router.post('/reconnect', reconnect);

export default router;
