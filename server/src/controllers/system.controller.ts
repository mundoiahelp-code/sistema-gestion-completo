import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(__dirname, '../../system-config.json');

// Configuración por defecto
const defaultConfig = {
  system: {
    systemName: 'Clodeb',
    systemUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    supportEmail: 'sistema@clodeb.com',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: process.env.SMTP_PORT || '465',
    secure: true,
    user: process.env.SMTP_USER || '',
    from: process.env.SMTP_FROM || 'Clodeb <sistema@clodeb.com>',
  },
};

// Cargar configuración
const loadConfig = () => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return { ...defaultConfig, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error loading config:', err);
  }
  return defaultConfig;
};

// Guardar configuración
const saveConfig = (config: any) => {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving config:', err);
    return false;
  }
};

// GET /system/config
export const getSystemConfig = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'No autorizado' });
    }
    
    const config = loadConfig();
    if (config.smtp) {
      config.smtp.pass = undefined;
    }
    
    res.json(config);
  } catch (error) {
    console.error('Error getting system config:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
};

// PUT /system/config
export const updateSystemConfig = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const currentConfig = loadConfig();
    const { system, smtp } = req.body;

    if (system) {
      currentConfig.system = { ...currentConfig.system, ...system };
    }
    
    if (smtp) {
      if (!smtp.pass) {
        smtp.pass = process.env.SMTP_PASS;
      } else {
        process.env.SMTP_PASS = smtp.pass;
      }
      currentConfig.smtp = { ...currentConfig.smtp, ...smtp };
      
      if (smtp.host) process.env.SMTP_HOST = smtp.host;
      if (smtp.port) process.env.SMTP_PORT = smtp.port;
      if (smtp.user) process.env.SMTP_USER = smtp.user;
      if (smtp.from) process.env.SMTP_FROM = smtp.from;
    }

    if (saveConfig(currentConfig)) {
      res.json({ success: true, message: 'Configuración guardada' });
    } else {
      res.status(500).json({ error: 'Error al guardar configuración' });
    }
  } catch (error) {
    console.error('Error updating system config:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
};

// POST /system/test-email
export const testEmail = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { to } = req.body;
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: to || process.env.SMTP_USER,
      subject: '✅ Test de Email - Clodeb Sistema',
      html: `<div style="font-family: sans-serif; padding: 20px;">
        <h2>🎉 ¡Email de prueba exitoso!</h2>
        <p>Si estás viendo este mensaje, la configuración SMTP está funcionando correctamente.</p>
      </div>`,
    });

    res.json({ success: true, message: 'Email enviado correctamente' });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    res.status(500).json({ success: false, error: error.message || 'Error al enviar email de prueba' });
  }
};

// Exportar función para obtener config
export const getConfig = () => loadConfig();


// GET /system/preview-email/:type - Previsualizar templates de email
export const previewEmail = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const config = loadConfig();
    
    const systemName = config?.system?.systemName || 'Clodeb';
    const supportEmail = config?.system?.supportEmail || 'sistema@Clodeb.store';
    
    let html = '';
    
    if (type === 'welcome' || type === 'verification') {
      const code = '847293';
      const digitBoxes = code.split('').map(d => `<td style="width:48px;height:56px;background-color:#f1f5f9;border-radius:8px;text-align:center;vertical-align:middle;"><span style="font-size:28px;font-weight:700;color:#0a0a0a;font-family:monospace;">${d}</span></td><td style="width:8px;"></td>`).join('');
      
      html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f6f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f9fc;padding:45px 0;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
<tr><td align="center" style="padding:0 40px 30px;"><div style="font-size:28px;font-weight:700;color:#0a0a0a;">${systemName}</div></td></tr>
<tr><td>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<tr><td align="center" style="padding:40px 40px 0;"><div style="width:64px;height:64px;background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%);border-radius:16px;line-height:64px;font-size:28px;">🚀</div></td></tr>
<tr><td align="center" style="padding:24px 40px 0;"><h1 style="margin:0;font-size:24px;font-weight:600;color:#0a0a0a;">¡Bienvenido a ${systemName}, Juan!</h1></td></tr>
<tr><td style="padding:16px 40px 0;"><p style="margin:0;font-size:16px;line-height:26px;color:#525f7f;text-align:center;">Gracias por elegirnos para gestionar tu negocio. Estás a un paso de empezar a organizar tu inventario, ventas y clientes de forma simple y profesional.</p></td></tr>
<tr><td align="center" style="padding:28px 40px 8px;"><p style="margin:0;font-size:14px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Tu código de verificación</p></td></tr>
<tr><td align="center" style="padding:8px 40px 24px;">
<table cellpadding="0" cellspacing="0"><tr>${digitBoxes}</tr></table>
</td></tr>
<tr><td style="padding:0 40px 32px;"><div style="background-color:#f8fafc;border-radius:8px;padding:16px 20px;"><p style="margin:0;font-size:14px;color:#64748b;line-height:22px;"><strong style="color:#475569;">⏱ Este código expira en 15 minutos.</strong><br>Ingresalo en la pantalla de verificación para activar tu cuenta.</p></div></td></tr>
</table>
</td></tr>
<tr><td align="center" style="padding:32px 40px 0;"><p style="margin:0;font-size:13px;color:#94a3b8;">¿Necesitás ayuda? <a href="mailto:${supportEmail}" style="color:#3b82f6;text-decoration:none;">${supportEmail}</a></p><p style="margin:16px 0 0;font-size:12px;color:#cbd5e1;">© 2023 ${systemName}. Todos los derechos reservados.</p></td></tr>
</table>
</td></tr>
</table>
</body></html>`;
    } else if (type === 'reset') {
      html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f6f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f9fc;padding:45px 0;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
<tr><td align="center" style="padding:0 40px 30px;"><div style="font-size:28px;font-weight:700;color:#0a0a0a;">${systemName}</div></td></tr>
<tr><td>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
<tr><td align="center" style="padding:40px 40px 0;"><div style="width:64px;height:64px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:16px;line-height:64px;font-size:28px;">🔐</div></td></tr>
<tr><td align="center" style="padding:24px 40px 0;"><h1 style="margin:0;font-size:24px;font-weight:600;color:#0a0a0a;">Restablecer contraseña</h1></td></tr>
<tr><td style="padding:16px 40px 0;"><p style="margin:0;font-size:16px;line-height:26px;color:#525f7f;text-align:center;">Hola <strong style="color:#0a0a0a;">Nicolas Percio</strong>, recibimos una solicitud para restablecer tu contraseña.</p></td></tr>
<tr><td align="center" style="padding:32px 40px;"><a href="#" style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">Crear nueva contraseña</a></td></tr>
<tr><td style="padding:0 40px 32px;"><div style="background-color:#f8fafc;border-radius:8px;padding:16px 20px;"><p style="margin:0;font-size:14px;color:#64748b;"><strong style="color:#475569;">⏱ Este link expira en 1 hora.</strong></p></div></td></tr>
</table>
</td></tr>
<tr><td align="center" style="padding:32px 40px 0;"><p style="margin:0;font-size:13px;color:#94a3b8;">¿Necesitás ayuda? <a href="mailto:${supportEmail}" style="color:#667eea;text-decoration:none;">${supportEmail}</a></p><p style="margin:16px 0 0;font-size:12px;color:#cbd5e1;">© 2023 ${systemName}. Todos los derechos reservados.</p></td></tr>
</table>
</td></tr>
</table>
</body></html>`;
    } else {
      return res.status(400).json({ error: 'Tipo de email no válido. Usa: welcome, reset' });
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error previewing email:', error);
    res.status(500).json({ error: 'Error al generar preview' });
  }
};

// POST /system/setup - Inicializar sistema
export const setupSystem = async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    
    if (userCount > 0) {
      return res.status(400).json({ error: 'El sistema ya está inicializado' });
    }

    const systemTenant = await prisma.tenant.create({
      data: {
        name: 'Sistema',
        slug: 'sistema',
        onboardingCompleted: true,
        active: true
      }
    });

    const hashedPassword = await bcrypt.hash('lautiClodebzonasur', 10);
    
    await prisma.user.create({
      data: {
        email: 'sistema@Clodeb.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        tenantId: systemTenant.id,
        active: true
      }
    });

    res.json({
      success: true,
      message: 'Sistema inicializado correctamente'
    });

  } catch (error: any) {
    console.error('Error en setup:', error);
    res.status(500).json({ error: 'Error al inicializar el sistema', details: error.message });
  }
};
