import { Router } from 'express';
import { BotController } from '../controllers/bot.controller';
import { authenticate } from '../middleware/auth';
import { authenticateBot } from '../middleware/botAuth';
import { requireFeature } from '../middleware/planFeatures';

const router = Router();

// Rutas públicas para el bot (autenticación por tenant ID)
router.get('/public/config', authenticateBot, BotController.getConfig);
router.get('/public/stats', authenticateBot, BotController.getStats);
router.post('/messages', authenticateBot, BotController.logChatMessage);
router.post('/generate-response', authenticateBot, BotController.generateResponse);

// Rutas que requieren autenticación de usuario
router.use(authenticate);
// Bot IA requiere plan Pro
router.use(requireFeature('bot'));

// Configuración del bot
router.get('/config', BotController.getConfig);
router.put('/config', BotController.updateConfig);
router.post('/toggle', BotController.toggleBot);
router.post('/reload-config', BotController.reloadConfig);

// Estadísticas y analytics
router.get('/stats', BotController.getStats);
router.get('/intent-analysis', BotController.getIntentAnalysis);

// Mensajes de chat
router.get('/messages', BotController.getChatMessages);

// Actualizar propiedades de mensajes
router.patch('/messages/category', BotController.updateCategory);
router.patch('/messages/notes', BotController.updateNotes);
router.patch('/messages/resolved', BotController.updateResolved);
router.patch('/messages/client-name', BotController.updateClientName);

// Eliminar chat
router.delete('/messages/:phone', BotController.deleteChat);

export default router;