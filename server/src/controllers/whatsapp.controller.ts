import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';

// Proxy controller para conectar con el bot de WhatsApp (chat-auto)
// El bot corre en un puerto separado (por defecto 3001)

const BOT_URL = process.env.BOT_API_URL || 'http://localhost:3001';

export const getStatus = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    // Obtener el puerto del bot desde la configuración del tenant
    const tenant = await (await import('../lib/prisma')).prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { botPort: true, botEnabled: true }
    });
    
    if (!tenant?.botEnabled) {
      return res.json({ 
        connected: false,
        message: 'Bot de WhatsApp deshabilitado para este tenant'
      });
    }
    
    const botUrl = tenant.botPort ? `http://localhost:${tenant.botPort}` : BOT_URL;
    
    const response = await axios.get(`${botUrl}/api/health`, { timeout: 5000 });
    res.json({ 
      connected: response.data.connected || false,
      tenantId: response.data.tenantId,
      tenantName: response.data.tenantName
    });
  } catch (error) {
    console.error('Error obteniendo estado de WhatsApp:', error);
    res.json({ 
      connected: false,
      message: 'No se pudo conectar con el bot de WhatsApp'
    });
  }
};

export const getQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const tenant = await (await import('../lib/prisma')).prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { botPort: true, botEnabled: true }
    });
    
    if (!tenant?.botEnabled) {
      return res.json({ 
        connected: false,
        message: 'Bot de WhatsApp deshabilitado para este tenant'
      });
    }
    
    const botUrl = tenant.botPort ? `http://localhost:${tenant.botPort}` : BOT_URL;
    
    const response = await axios.get(`${botUrl}/api/qr`, { timeout: 5000 });
    res.json(response.data);
  } catch (error) {
    console.error('Error obteniendo QR de WhatsApp:', error);
    res.json({ 
      connected: false,
      qrCode: null,
      message: 'No se pudo obtener el código QR'
    });
  }
};

export const getConnectionStatus = async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${BOT_URL}/api/health`, { timeout: 5000 });
    res.json({ 
      connected: response.data.connected || false
    });
  } catch (error) {
    res.json({ 
      connected: false
    });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { phone, message } = req.body;
    const tenantId = req.user?.tenantId;
    
    if (!phone || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'phone y message son requeridos'
      });
    }
    
    const tenant = await (await import('../lib/prisma')).prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { botPort: true, botEnabled: true }
    });
    
    if (!tenant?.botEnabled) {
      return res.status(400).json({ 
        success: false,
        error: 'Bot de WhatsApp deshabilitado para este tenant'
      });
    }
    
    const botUrl = tenant.botPort ? `http://localhost:${tenant.botPort}` : BOT_URL;
    
    const response = await axios.post(
      `${botUrl}/api/send-message`,
      { phone, message },
      { timeout: 10000 }
    );
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Error enviando mensaje de WhatsApp:', error);
    res.status(500).json({ 
      success: false,
      error: error.response?.data?.error || 'Error enviando mensaje'
    });
  }
};

export const sendRepairMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { phone, message } = req.body;
    const tenantId = req.user?.tenantId;
    
    if (!phone || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'phone y message son requeridos'
      });
    }
    
    const tenant = await (await import('../lib/prisma')).prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { botPort: true, botEnabled: true }
    });
    
    if (!tenant?.botEnabled) {
      return res.status(400).json({ 
        success: false,
        error: 'Bot de WhatsApp deshabilitado para este tenant'
      });
    }
    
    const botUrl = tenant.botPort ? `http://localhost:${tenant.botPort}` : BOT_URL;
    
    const response = await axios.post(
      `${botUrl}/api/send-message`,
      { phone, message },
      { timeout: 10000 }
    );
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Error enviando mensaje de reparación:', error);
    res.status(500).json({ 
      success: false,
      error: error.response?.data?.error || 'Error enviando mensaje'
    });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const tenant = await (await import('../lib/prisma')).prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { botPort: true }
    });
    
    const botUrl = tenant?.botPort ? `http://localhost:${tenant.botPort}` : BOT_URL;
    
    // El bot no tiene endpoint de logout, simplemente retornar éxito
    res.json({ 
      success: true,
      message: 'Para desconectar WhatsApp, detené el bot'
    });
  } catch (error) {
    res.json({ 
      success: false,
      message: 'Error al desconectar'
    });
  }
};

export const disconnect = async (req: Request, res: Response) => {
  res.json({ 
    success: true,
    message: 'Para desconectar WhatsApp, detené el bot'
  });
};

export const reconnect = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const tenant = await (await import('../lib/prisma')).prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { botPort: true, botEnabled: true }
    });
    
    if (!tenant?.botEnabled) {
      return res.json({ 
        success: false,
        message: 'Bot de WhatsApp deshabilitado para este tenant'
      });
    }
    
    const botUrl = tenant.botPort ? `http://localhost:${tenant.botPort}` : BOT_URL;
    
    // Simplemente verificar que el bot esté corriendo
    await axios.get(`${botUrl}/api/health`, { timeout: 5000 });
    
    res.json({ 
      success: true,
      message: 'Bot de WhatsApp activo. Escaneá el QR para conectar.'
    });
  } catch (error) {
    console.error('Error reconectando WhatsApp:', error);
    res.json({ 
      success: false,
      message: 'No se pudo conectar con el bot. Asegurate de que esté corriendo.'
    });
  }
};
