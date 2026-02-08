import { Request, Response } from 'express';
import { instagramService } from '../services/instagram.service';
import axios from 'axios';

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

// OAuth Callback - Intercambiar código por token
export const oauthCallback = async (req: Request, res: Response) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Código de autorización requerido' });
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appId || !appSecret) {
      return res.status(500).json({ error: 'Facebook App no configurada' });
    }

    console.log('🔄 Intercambiando código por token...');

    // 1. Intercambiar código por token de acceso
    const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code: code,
      },
    });

    const accessToken = tokenResponse.data.access_token;
    console.log('✅ Token obtenido');

    // 2. Obtener las páginas del usuario
    const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
      params: {
        access_token: accessToken,
        fields: 'id,name,access_token,instagram_business_account',
      },
    });

    const pages = pagesResponse.data.data;
    console.log(`📄 Páginas encontradas: ${pages.length}`);

    // 3. Buscar la primera página con Instagram Business Account
    let instagramAccount = null;
    let pageAccessToken = null;

    for (const page of pages) {
      if (page.instagram_business_account) {
        instagramAccount = page.instagram_business_account.id;
        pageAccessToken = page.access_token;
        console.log(`✅ Instagram Business Account encontrado: ${instagramAccount}`);
        break;
      }
    }

    if (!instagramAccount || !pageAccessToken) {
      return res.status(400).json({
        error: 'No se encontró una cuenta de Instagram Business vinculada a tus páginas de Facebook',
      });
    }

    // 4. Obtener información del Instagram Account
    const igResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagramAccount}`, {
      params: {
        access_token: pageAccessToken,
        fields: 'id,username,name,profile_picture_url',
      },
    });

    const username = igResponse.data.username || igResponse.data.name;
    console.log(`✅ Usuario de Instagram: @${username}`);

    // 5. Conectar con el servicio
    const result = await instagramService.connect({
      pageId: instagramAccount,
      pageAccessToken: pageAccessToken,
      appId: appId,
      appSecret: appSecret,
    });

    if (result.success) {
      res.json({
        success: true,
        message: `Conectado a @${username}`,
        username: username,
      });
    } else {
      res.status(400).json({ error: result.message });
    }
  } catch (error: any) {
    console.error('❌ Error en OAuth callback:', error.response?.data || error.message);
    const errorMsg = error.response?.data?.error?.message || 'Error al conectar Instagram';
    res.status(500).json({ error: errorMsg });
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
