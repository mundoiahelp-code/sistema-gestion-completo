import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'MANAGER', 'SELLER']).optional(),
  tenantId: z.string().optional()
});

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { store: true, tenant: true }
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar que el tenant esté activo (excepto SUPER_ADMIN que no depende de tenant)
    if (user.role !== 'SUPER_ADMIN' && (!user.tenant || !user.tenant.active)) {
      return res.status(401).json({ error: 'Tu cuenta ha sido desactivada. Contactá al administrador.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar access token (1 hora)
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        tenantId: user.tenantId 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Generar refresh token (7 días)
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Guardar refresh token en la base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        refreshTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 1000 // 1 hora
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    });

    // Calcular estado de suscripción
    let subscription = null;
    if (user.tenant && user.role !== 'SUPER_ADMIN') {
      const now = new Date();
      const nextPayment = user.tenant.nextPaymentDate ? new Date(user.tenant.nextPaymentDate) : null;
      const isExpired = nextPayment ? now > nextPayment : false;
      const daysRemaining = nextPayment ? Math.ceil((nextPayment.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

      subscription = {
        plan: user.tenant.plan,
        isExpired,
        daysRemaining,
        nextPaymentDate: nextPayment,
        paymentStatus: user.tenant.paymentStatus
      };
    }

    const { password: _, ...userWithoutPassword } = user;
    
    // Registrar login en auditoría
    const { createAuditLog } = await import('../middleware/audit');
    await createAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      tenantId: user.tenantId,
      action: 'LOGIN',
      entity: 'AUTH',
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown'
    });
    
    res.json({ user: userWithoutPassword, token, refreshToken, subscription });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(400).json({ error: 'Error al iniciar sesión' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Si no se proporciona tenantId, buscar o crear uno por defecto
    let tenantId = data.tenantId;
    if (!tenantId) {
      let tenant = await prisma.tenant.findFirst();
      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            name: 'Mundo Apple',
            slug: 'mundoiaple'
          }
        });
      }
      tenantId = tenant.id;
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role || 'SELLER',
        tenantId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true
      }
    });

    res.status(201).json({ user });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(400).json({ error: 'Error al registrar usuario' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('accessToken');
  res.json({ message: 'Sesión cerrada' });
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { store: true, tenant: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarColor: true,
        active: true,
        store: true,
        storeId: true,
        tenant: true,
        tenantId: true,
        createdAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Error en me:', error);
    res.status(400).json({ error: 'Error al obtener usuario' });
  }
};

export const verifyPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Contraseña requerida', valid: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado', valid: false });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    
    res.json({ valid: validPassword });
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    res.status(500).json({ error: 'Error al verificar contraseña', valid: false });
  }
};

// Renovar access token usando refresh token
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token no proporcionado' });
    }

    // Verificar el refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as { userId: string };

    // Buscar usuario y verificar que el refresh token coincida
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true }
    });

    if (!user || !user.active || user.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }

    // Verificar que el refresh token no haya expirado
    if (user.refreshTokenExpires && new Date() > user.refreshTokenExpires) {
      return res.status(401).json({ error: 'Refresh token expirado' });
    }

    // Generar nuevo access token
    const newAccessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        tenantId: user.tenantId 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 1000 // 1 hora
    });

    res.json({ token: newAccessToken, message: 'Token renovado exitosamente' });
  } catch (error) {
    console.error('Error renovando token:', error);
    res.status(401).json({ error: 'Error al renovar token' });
  }
};
