import { Request, Response } from 'express';
import { whatsappService } from '../services/whatsapp.service';
import { anthropicService } from '../services/anthropic.service';
import QRCode from 'qrcode';
import axios from 'axios';

export const getStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    
    if (!tenantId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // MULTI-TENANT: Obtener estado del bot del tenant
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { botPort: true, name: true }
    });

    await prisma.$disconnect();

    if (!tenant || !tenant.botPort) {
      return res.json({ 
        connected: false,
        hasQR: false,
        error: 'Bot no configurado'
      });
    }

    // Obtener estado del bot del tenant
    const botUrl = `http://localhost:${tenant.botPort}/api/health`;
    
    try {
      const response = await axios.get(botUrl, { timeout: 5000 });
      const data = response.data as { connected?: boolean };
      
      res.json({ 
        connected: data.connected || false,
        hasQR: !data.connected
      });

    } catch (error) {
      console.error(`❌ Error obteniendo estado del bot:`, error);
      res.json({ 
        connected: false,
        hasQR: false,
        error: 'Bot no disponible'
      });
    }
  } catch (error) {
    console.error('Error en getStatus:', error);
    res.status(500).json({ error: 'Error obteniendo estado de WhatsApp' });
  }
};

export const getQRCode = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    
    if (!tenantId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // MULTI-TENANT: Obtener QR del bot del tenant
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { botPort: true, name: true, plan: true }
    });

    await prisma.$disconnect();

    if (!tenant || !tenant.botPort) {
      return res.status(400).json({ 
        error: 'Bot no configurado para este tenant',
        needsSetup: true 
      });
    }

    // Obtener QR del bot del tenant
    const botUrl = `http://localhost:${tenant.botPort}/api/qr`;
    console.log(`📱 [${tenant.name}] Obteniendo QR del bot en puerto ${tenant.botPort}`);

    try {
      const response = await axios.get(botUrl, { timeout: 5000 });
      const data = response.data as { connected?: boolean; qrCode?: string; phone?: string };

      if (data.connected) {
        console.log(`✅ [${tenant.name}] Bot ya conectado: ${data.phone}`);
        return res.json({ connected: true, qrCode: null, phone: data.phone });
      }

      if (data.qrCode) {
        console.log(`📱 [${tenant.name}] QR disponible`);
        // Generar QR como imagen base64
        const qrImage = await QRCode.toDataURL(data.qrCode);
        return res.json({ connected: false, qrCode: qrImage });
      }

      return res.json({ connected: false, qrCode: null, message: 'Esperando QR...' });

    } catch (error) {
      console.error(`❌ Error conectando con bot del tenant:`, error);
      return res.status(500).json({ 
        error: 'Bot no disponible. Asegurate de que el bot esté corriendo.',
        needsBot: true 
      });
    }
  } catch (error) {
    console.error('Error en getQRCode:', error);
    res.status(500).json({ error: 'Error obteniendo QR' });
  }
};

export const sendRepairMessage = async (req: Request, res: Response) => {
  try {
    const { 
      clientName, 
      clientPhone, 
      deviceModel, 
      repairName, 
      cost, 
      deliveryDate, 
      deliveryTime, 
      office,
      address 
    } = req.body;

    const tenantId = (req as any).user?.tenantId;

    // Verificar conexión
    const status = whatsappService.getStatus();
    if (!status.connected) {
      return res.status(400).json({ 
        error: 'WhatsApp no está conectado. Escanea el QR primero.',
        needsQR: true 
      });
    }

    // Intentar obtener nombre de WhatsApp
    const whatsappName = await whatsappService.getContactName(clientPhone);

    // Generar mensaje con IA
    const message = await anthropicService.generateRepairMessage({
      clientName,
      whatsappName,
      deviceModel,
      repairName,
      cost,
      deliveryDate,
      deliveryTime,
      office,
      address,
    });

    // Enviar mensaje (con tenantId para multi-tenant)
    const sent = await whatsappService.sendMessage(clientPhone, message, tenantId);

    if (sent) {
      res.json({ success: true, message, whatsappName });
    } else {
      res.status(500).json({ error: 'Error enviando mensaje' });
    }
  } catch (error) {
    console.error('Error en sendRepairMessage:', error);
    res.status(500).json({ error: 'Error procesando solicitud' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    await whatsappService.logout();
    res.json({ success: true, message: 'Sesión cerrada' });
  } catch (error) {
    res.status(500).json({ error: 'Error cerrando sesión' });
  }
};

export const reconnect = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    
    if (!tenantId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // MULTI-TENANT: Reconectar el bot del tenant
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { botPort: true, name: true }
    });

    await prisma.$disconnect();

    if (!tenant || !tenant.botPort) {
      return res.status(400).json({ 
        error: 'Bot no configurado para este tenant' 
      });
    }

    // El bot del tenant se reconecta automáticamente cuando se solicita el QR
    // Solo necesitamos confirmar que está disponible
    const botUrl = `http://localhost:${tenant.botPort}/api/health`;
    
    try {
      const response = await axios.get(botUrl, { timeout: 5000 });
      console.log(`🔄 [${tenant.name}] Bot listo para reconectar`);
      res.json({ success: true, message: 'Generando nuevo QR...' });
    } catch (error) {
      console.error(`❌ Error verificando bot del tenant:`, error);
      res.status(500).json({ 
        error: 'Bot no disponible. Asegurate de que el bot esté corriendo.' 
      });
    }
  } catch (error) {
    console.error('Error en reconnect:', error);
    res.status(500).json({ error: 'Error reconectando' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { phone, message } = req.body;
    const tenantId = (req as any).user?.tenantId;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Teléfono y mensaje son requeridos' });
    }

    if (!tenantId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // MULTI-TENANT: Verificar que el bot del tenant esté conectado
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { botPort: true, name: true }
    });

    await prisma.$disconnect();

    if (!tenant || !tenant.botPort) {
      return res.status(400).json({ 
        error: 'Bot no configurado para este tenant',
        needsQR: true 
      });
    }

    // Verificar que el bot esté conectado
    const botUrl = `http://localhost:${tenant.botPort}/api/health`;
    
    try {
      const healthResponse = await axios.get(botUrl, { timeout: 5000 });
      const healthData = healthResponse.data as { connected?: boolean };
      
      if (!healthData.connected) {
        return res.status(400).json({ 
          error: 'WhatsApp no está conectado',
          needsQR: true 
        });
      }

    } catch (error) {
      console.error(`❌ Error verificando bot del tenant:`, error);
      return res.status(500).json({ 
        error: 'Bot no disponible. Asegurate de que el bot esté corriendo.',
        needsBot: true 
      });
    }

    // Enviar mensaje a través del bot del tenant
    const sent = await whatsappService.sendMessage(phone, message, tenantId);

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
