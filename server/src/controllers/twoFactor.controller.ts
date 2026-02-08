import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Generar secret y QR code para configurar 2FA
export const setup2FA = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, twoFactorEnabled: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA ya está habilitado' });
    }

    // Generar secret
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: 'Clodeb',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret
    });

    // Generar códigos de respaldo (10 códigos de 8 caracteres)
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Generar QR code
    const otpauthUrl = totp.toString();
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Guardar el secret temporalmente (se confirmará cuando verifique el código)
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorBackupCodes: JSON.stringify(backupCodes)
      }
    });

    res.json({
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      backupCodes,
      manualEntry: {
        issuer: 'Clodeb',
        account: user.email,
        secret: secret.base32
      }
    });
  } catch (error) {
    console.error('Error setting up 2FA:', error);
    res.status(500).json({ error: 'Error al configurar 2FA' });
  }
};

// Verificar código y activar 2FA
export const verify2FA = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { code } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!code || code.length !== 6) {
      return res.status(400).json({ error: 'Código inválido' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, twoFactorSecret: true, twoFactorEnabled: true }
    });

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({ error: 'Primero debes configurar 2FA' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA ya está habilitado' });
    }

    // Verificar el código
    const totp = new OTPAuth.TOTP({
      issuer: 'Clodeb',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret)
    });

    const delta = totp.validate({ token: code, window: 1 });

    if (delta === null) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    // Activar 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });

    res.json({ message: '2FA activado correctamente' });
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    res.status(500).json({ error: 'Error al verificar código' });
  }
};

// Desactivar 2FA
export const disable2FA = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { password, code } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        password: true,
        twoFactorEnabled: true, 
        twoFactorSecret: true,
        twoFactorBackupCodes: true
      }
    });

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA no está habilitado' });
    }

    // Verificar contraseña
    const bcrypt = require('bcryptjs');
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Verificar código 2FA o código de respaldo
    let isValid = false;

    if (user.twoFactorSecret) {
      const totp = new OTPAuth.TOTP({
        issuer: 'Clodeb',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret)
      });

      const delta = totp.validate({ token: code, window: 1 });
      if (delta !== null) {
        isValid = true;
      }
    }

    // Si no es válido, verificar códigos de respaldo
    if (!isValid && user.twoFactorBackupCodes) {
      const backupCodes = JSON.parse(user.twoFactorBackupCodes);
      if (backupCodes.includes(code.toUpperCase())) {
        isValid = true;
      }
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    // Desactivar 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null
      }
    });

    res.json({ message: '2FA desactivado correctamente' });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    res.status(500).json({ error: 'Error al desactivar 2FA' });
  }
};

// Validar código 2FA durante el login
export const validate2FACode = async (userId: string, code: string): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        twoFactorEnabled: true, 
        twoFactorSecret: true,
        twoFactorBackupCodes: true
      }
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    // Verificar código TOTP
    const totp = new OTPAuth.TOTP({
      issuer: 'Clodeb',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret)
    });

    const delta = totp.validate({ token: code, window: 1 });
    if (delta !== null) {
      return true;
    }

    // Verificar código de respaldo
    if (user.twoFactorBackupCodes) {
      const backupCodes = JSON.parse(user.twoFactorBackupCodes);
      const codeIndex = backupCodes.indexOf(code.toUpperCase());
      
      if (codeIndex !== -1) {
        // Remover el código usado
        backupCodes.splice(codeIndex, 1);
        await prisma.user.update({
          where: { id: userId },
          data: { twoFactorBackupCodes: JSON.stringify(backupCodes) }
        });
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error validating 2FA code:', error);
    return false;
  }
};

// Obtener estado de 2FA
export const get2FAStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        twoFactorEnabled: true,
        twoFactorBackupCodes: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    let backupCodesCount = 0;
    if (user.twoFactorBackupCodes) {
      const codes = JSON.parse(user.twoFactorBackupCodes);
      backupCodesCount = codes.length;
    }

    res.json({
      enabled: user.twoFactorEnabled,
      backupCodesRemaining: backupCodesCount
    });
  } catch (error) {
    console.error('Error getting 2FA status:', error);
    res.status(500).json({ error: 'Error al obtener estado de 2FA' });
  }
};

// Regenerar códigos de respaldo
export const regenerateBackupCodes = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { password } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        password: true,
        twoFactorEnabled: true
      }
    });

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA no está habilitado' });
    }

    // Verificar contraseña
    const bcrypt = require('bcryptjs');
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generar nuevos códigos
    const backupCodes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: JSON.stringify(backupCodes) }
    });

    res.json({ backupCodes });
  } catch (error) {
    console.error('Error regenerating backup codes:', error);
    res.status(500).json({ error: 'Error al regenerar códigos' });
  }
};
