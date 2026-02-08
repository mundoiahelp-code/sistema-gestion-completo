import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireFeature } from '../middleware/planFeatures';
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

// Endpoint interno para chat-auto (protegido con secret)
router.post('/internal/send', async (req: Request, res: Response) => {
  try {
    // SEGURIDAD: Verificar secret o IP localhost
    const internalSecret = req.headers['x-internal-secret'];
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1';
    
    if (!isLocalhost && internalSecret !== process.env.INTERNAL_API_SECRET) {
      return res.status(403).json({ error: 'Acceso no autorizado' });
    }
    
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
// WhatsApp requiere plan Basic o superior
router.use(requireFeature('whatsapp'));

router.get('/status', getStatus);
router.get('/qr', getQRCode);
router.get('/groups', getGroups);
router.post('/send-repair', sendRepairMessage);
router.post('/send', sendMessage);
router.post('/logout', logout);
router.post('/reconnect', reconnect);

export default router;
