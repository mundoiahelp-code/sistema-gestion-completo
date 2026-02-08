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

// ===== RUTAS DE CRM (disponibles en plan básico) =====
// Mensajes de chat
router.get('/messages', BotController.getChatMessages);

// Actualizar propiedades de mensajes
router.patch('/messages/category', BotController.updateCategory);
router.patch('/messages/notes', BotController.updateNotes);
router.patch('/messages/resolved', BotController.updateResolved);
router.patch('/messages/client-name', BotController.updateClientName);

// Eliminar chat
router.delete('/messages/:phone', BotController.deleteChat);

// Estadísticas básicas
router.get('/stats', BotController.getStats);

// ===== RUTAS DE BOT IA (requieren plan Pro) =====
// Configuración del bot IA
router.get('/config', requireFeature('bot'), BotController.getConfig);
router.put('/config', requireFeature('bot'), BotController.updateConfig);
router.post('/toggle', requireFeature('bot'), BotController.toggleBot);
router.post('/reload-config', requireFeature('bot'), BotController.reloadConfig);

// Analytics avanzados del bot IA
router.get('/intent-analysis', requireFeature('bot'), BotController.getIntentAnalysis);

export default router;