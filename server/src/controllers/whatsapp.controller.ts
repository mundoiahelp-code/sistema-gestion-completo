import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';

// Proxy controller para conectar con el bot de WhatsApp (chat-auto)
// El bot debe correr en un servidor separado

const BOT_URL = process.env.BOT_API_URL || process.env.WHATSAPP_BOT_URL || 'http://localhost:3001';

export const getStatus = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    // Verificar si hay URL del bot configurada
    if (!BOT_URL || BOT_URL === 'http://localhost:3001') {
      return res.json({ 
        connected: false,
        message: 'Bot de WhatsApp no configurado. Configurá WHATSAPP_BOT_URL en las variables de entorno.',
        needsSetup: true
      });
    }
    
    // Obtener configuración del tenant
    const tenant = await (await import('../lib/prisma')).prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { botPort: true, botEnabled: true, id: true }
    });
    
    if (!tenant?.botEnabled) {
      return res.json({ 
        connected: false,
        message: 'Bot de WhatsApp deshabilitado para este tenant'
      });
    }
    
    // Usar URL del bot configurada
    const botUrl = BOT_URL;
    
    const response = await axios.get(`${botUrl}/api/qr`, { 
      timeout: 5000,
      headers: { 'X-Tenant-ID': tenant.id }
    });
    
    res.json({ 
      connected: response.data.connected || false,
      phone: response.data.phone
    });
  } catch (error: any) {
    console.error('Error obteniendo estado de WhatsApp:', error);
    res.json({ 
      connected: false,
      message: error.code === 'ECONNREFUSED' 
        ? 'El bot de WhatsApp no está corriendo. Inicialo en el servidor configurado.'
        : 'No se pudo conectar con el bot de WhatsApp',
      needsSetup: error.code === 'ECONNREFUSED'
    });
  }
};

export const getQRCode = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    // Verificar si hay URL del bot configurada
    if (!BOT_URL || BOT_URL === 'http://localhost:3001') {
      return res.json({ 
        connected: false,
        qrCode: null,
        message: 'Bot de WhatsApp no configurado. Configurá WHATSAPP_BOT_URL en las variables de entorno.',
        needsSetup: true
      });
    }
    
    const tenant = await (await import('../lib/prisma')).prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { botPort: true, botEnabled: true, id: true }
    });
    
    if (!tenant?.botEnabled) {
      return res.json({ 
        connected: false,
        qrCode: null,
        message: 'Bot de WhatsApp deshabilitado para este tenant'
      });
    }
    
    const botUrl = BOT_URL;
    
    const response = await axios.get(`${botUrl}/api/qr`, { 
      timeout: 5000,
      headers: { 'X-Tenant-ID': tenant.id }
    });
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Error obteniendo QR de WhatsApp:', error);
    res.json({ 
      connected: false,
      qrCode: null,
      message: error.code === 'ECONNREFUSED'
        ? 'El bot de WhatsApp no está corriendo. Inicialo en el servidor configurado.'
        : 'No se pudo obtener el código QR',
      needsSetup: error.code === 'ECONNREFUSED'
    });
  }
};

export const getConnectionStatus = async (req: Request, res: Response) => {
  try {
    if (!BOT_URL || BOT_URL === 'http://localhost:3001') {
      return res.json({ connected: false, needsSetup: true });
    }
    
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
    
    console.log('📤 sendMessage - tenantId:', tenantId);
    console.log('📤 sendMessage - phone:', phone);
    console.log('📤 sendMessage - req.user:', req.user);
    
    if (!phone || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'phone y message son requeridos'
      });
    }
    
    if (!tenantId) {
      console.error('❌ No hay tenantId en req.user');
      return res.status(401).json({ 
        success: false,
        error: 'No autorizado - falta tenantId'
      });
    }
    
    if (!BOT_URL || BOT_URL === 'http://localhost:3001') {
      return res.status(400).json({ 
        success: false,
        error: 'Bot de WhatsApp no configurado'
      });
    }
    
    const tenant = await (await import('../lib/prisma')).prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { botPort: true, botEnabled: true, id: true }
    });
    
    if (!tenant?.botEnabled) {
      return res.status(400).json({ 
        success: false,
        error: 'Bot de WhatsApp deshabilitado para este tenant'
      });
    }
    
    const botUrl = BOT_URL;
    
    console.log('📤 Enviando al bot:', botUrl, 'con tenant:', tenant.id);
    
    const response = await axios.post(
      `${botUrl}/api/send-message`,
      { phone, message },
      { 
        timeout: 10000,
        headers: { 'X-Tenant-ID': tenant.id }
      }
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
    
    if (!BOT_URL || BOT_URL === 'http://localhost:3001') {
      return res.status(400).json({ 
        success: false,
        error: 'Bot de WhatsApp no configurado'
      });
    }
    
    const tenant = await (await import('../lib/prisma')).prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { botPort: true, botEnabled: true, id: true }
    });
    
    if (!tenant?.botEnabled) {
      return res.status(400).json({ 
        success: false,
        error: 'Bot de WhatsApp deshabilitado para este tenant'
      });
    }
    
    const botUrl = BOT_URL;
    
    const response = await axios.post(
      `${botUrl}/api/send-message`,
      { phone, message, tenantId: tenant.id },
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
    
    if (!BOT_URL || BOT_URL === 'http://localhost:3001') {
      return res.json({ 
        success: false,
        message: 'Bot de WhatsApp no configurado'
      });
    }
    
    const tenant = await (await import('../lib/prisma')).prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true }
    });
    
    if (!tenant) {
      return res.status(404).json({ 
        success: false,
        error: 'Tenant no encontrado'
      });
    }
    
    const botUrl = BOT_URL;
    
    // Llamar al bot para que cierre la sesión
    const response = await axios.post(
      `${botUrl}/api/logout`,
      {},
      { 
        timeout: 10000,
        headers: { 'X-Tenant-ID': tenant.id }
      }
    );
    
    res.json({ 
      success: true,
      message: 'Sesión de WhatsApp cerrada correctamente'
    });
  } catch (error: any) {
    console.error('Error cerrando sesión de WhatsApp:', error);
    res.status(500).json({ 
      success: false,
      error: error.response?.data?.error || 'Error cerrando sesión'
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
    
    if (!BOT_URL || BOT_URL === 'http://localhost:3001') {
      return res.json({ 
        success: false,
        message: 'Bot de WhatsApp no configurado. Configurá WHATSAPP_BOT_URL en las variables de entorno.',
        needsSetup: true
      });
    }
    
    const tenant = await (await import('../lib/prisma')).prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { botPort: true, botEnabled: true, id: true }
    });
    
    if (!tenant?.botEnabled) {
      return res.json({ 
        success: false,
        message: 'Bot de WhatsApp deshabilitado para este tenant'
      });
    }
    
    const botUrl = BOT_URL;
    
    // Llamar al endpoint /connect del bot para iniciar la conexión
    const response = await axios.post(
      `${botUrl}/api/connect`,
      {},
      { 
        timeout: 5000,
        headers: { 'X-Tenant-ID': tenant.id }
      }
    );
    
    res.json({ 
      success: true,
      message: 'Conexión iniciada. Escaneá el QR para conectar.',
      data: response.data
    });
  } catch (error: any) {
    console.error('Error reconectando WhatsApp:', error);
    res.json({ 
      success: false,
      message: error.code === 'ECONNREFUSED'
        ? 'El bot de WhatsApp no está corriendo. Inicialo en el servidor configurado.'
        : 'No se pudo conectar con el bot. Asegurate de que esté corriendo.',
      needsSetup: error.code === 'ECONNREFUSED'
    });
  }
};

export const getGroups = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    console.log('📋 getGroups - tenantId:', tenantId);
    
    if (!BOT_URL || BOT_URL === 'http://localhost:3001') {
      console.log('⚠️  getGroups - Bot URL no configurada');
      return res.json({ groups: [] });
    }
    
    const tenant = await (await import('../lib/prisma')).prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { botPort: true, botEnabled: true, id: true }
    });
    
    if (!tenant?.botEnabled) {
      console.log('⚠️  getGroups - Bot deshabilitado para tenant');
      return res.json({ groups: [] });
    }
    
    const botUrl = BOT_URL;
    console.log('📋 getGroups - Llamando al bot:', botUrl);
    
    const response = await axios.get(
      `${botUrl}/api/groups`,
      { 
        timeout: 5000,
        headers: { 'X-Tenant-ID': tenant.id }
      }
    );
    
    console.log('✅ getGroups - Grupos recibidos:', response.data.groups?.length || 0);
    res.json(response.data);
  } catch (error: any) {
    console.error('❌ getGroups - Error:', error.message);
    res.json({ groups: [] });
  }
};;
