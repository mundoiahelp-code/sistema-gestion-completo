import { Request, Response } from 'express';
import { instagramService } from '../services/instagram.service';

export const getStatus = async (req: Request, res: Response) => {
  try {
    const status = instagramService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo estado de Instagram' });
  }
};

export const connect = async (req: Request, res: Response) => {
  try {
    const { pageId, pageAccessToken, appId, appSecret } = req.body;

    if (!pageId || !pageAccessToken) {
      return res.status(400).json({
        error: 'Page ID y Access Token son requeridos',
      });
    }

    const result = await instagramService.connect({
      pageId,
      pageAccessToken,
      appId: appId || '',
      appSecret: appSecret || '',
    });

    if (result.success) {
      res.json({ success: true, message: result.message });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error en connect:', error);
    res.status(500).json({ error: 'Error conectando Instagram' });
  }
};

export const disconnect = async (req: Request, res: Response) => {
  try {
    await instagramService.disconnect();
    res.json({ success: true, message: 'Instagram desconectado' });
  } catch (error) {
    res.status(500).json({ error: 'Error desconectando Instagram' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { recipientId, message } = req.body;

    if (!recipientId || !message) {
      return res.status(400).json({
        error: 'Recipient ID y mensaje son requeridos',
      });
    }

    const status = instagramService.getStatus();
    if (!status.connected) {
      return res.status(400).json({
        error: 'Instagram no está conectado',
        needsConnection: true,
      });
    }

    const sent = await instagramService.sendMessage(recipientId, message);

    if (sent) {
      res.json({ success: true, message: 'Mensaje enviado' });
    } else {
      res.status(500).json({ error: 'Error enviando mensaje' });
    }
  } catch (error) {
    console.error('Error en sendMessage:', error);
    res.status(500).json({ error: 'Error enviando mensaje' });
  }
};

export const getUserInfo = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const userInfo = await instagramService.getUserInfo(userId);

    if (userInfo) {
      res.json(userInfo);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo información del usuario' });
  }
};

// Webhook endpoints
export const verifyWebhook = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token && challenge) {
    const result = instagramService.verifyWebhook(
      mode as string,
      token as string,
      challenge as string
    );

    if (result) {
      res.status(200).send(result);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    await instagramService.processWebhook(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.sendStatus(500);
  }
};
