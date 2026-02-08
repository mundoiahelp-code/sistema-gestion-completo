import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { invalidateTenantCache } from '../lib/cache';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'MANAGER', 'SELLER']),
  storeId: z.string().uuid().optional(),
  active: z.boolean().optional()
});

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const tenantId = req.user?.tenantId;
    
    const users = await prisma.user.findMany({
      where: {
        tenantId, // FILTRAR POR TENANT
        active: true, // SOLO USUARIOS ACTIVOS
        OR: [
          { name: { contains: search as string } },
          { email: { contains: search as string } }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarColor: true,
        active: true,
        store: true,
        createdAt: true
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({
      where: {
        tenantId, // FILTRAR POR TENANT
        active: true, // SOLO USUARIOS ACTIVOS
        OR: [
          { name: { contains: search as string } },
          { email: { contains: search as string } }
        ]
      }
    });

    res.json({ users, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener usuarios' });
  }
};

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarColor: true,
        active: true,
        store: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener usuario' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    // Validaciones
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (!name || name.length < 2) {
      return res.status(400).json({ error: 'El nombre debe tener al menos 2 caracteres' });
    }

    if (!role || !['ADMIN', 'MANAGER', 'SELLER'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // Obtener el tenantId del usuario que está creando
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'No se pudo determinar el tenant' });
    }

    // Verificar límite de usuarios según el plan
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true }
    });

    const planLimits: Record<string, number> = {
      trial: 2, // Cambiado de 4 a 2
      basic: 8,
      pro: 18
    };

    const maxUsers = planLimits[tenant?.plan || 'trial'] || 2;

    // Contar usuarios activos del tenant
    const currentUserCount = await prisma.user.count({
      where: { tenantId, active: true }
    });

    if (currentUserCount >= maxUsers) {
      const planName = tenant?.plan === 'pro' ? 'Profesional' : tenant?.plan === 'basic' ? 'Básico' : 'Prueba gratuita';
      return res.status(400).json({ 
        error: `Has alcanzado el límite de ${maxUsers} usuarios para el plan ${planName}. Actualizá tu plan para agregar más usuarios.` 
      });
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Si existe un usuario inactivo con ese email, reactivarlo
    if (existingUser) {
      if (existingUser.active) {
        return res.status(400).json({ error: 'El email ya está en uso' });
      }
      
      // Reactivar usuario existente
      const user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          password: hashedPassword,
          name,
          role,
          active: true
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          active: true,
          createdAt: true
        }
      });
      
      // Invalidar caché del tenant
      invalidateTenantCache(tenantId);
      
      return res.status(201).json({ user });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        tenantId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    // Invalidar caché del tenant para que el próximo check tenga el conteo actualizado
    invalidateTenantCache(tenantId);

    res.status(201).json({ user });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'El email ya está en uso' });
    }
    res.status(400).json({ error: 'Error al crear usuario' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const data = userSchema.partial().parse(req.body);
    const tenantId = req.user?.tenantId;
    
    // Verificar que el usuario pertenece al tenant
    const existing = await prisma.user.findFirst({
      where: { id: req.params.id, tenantId }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar usuario' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user?.tenantId;
    
    // Verificar que el usuario pertenece al tenant
    const existing = await prisma.user.findFirst({
      where: { id: req.params.id, tenantId }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    await prisma.user.update({
      where: { id: req.params.id },
      data: { active: false }
    });

    // Invalidar caché del tenant para que el próximo check tenga el conteo actualizado
    invalidateTenantCache(tenantId!);

    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar usuario' });
  }
};

// Actualizar cuenta del usuario actual
export const updateMyAccount = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || name.length < 3) {
      return res.status(400).json({ 
        errors: { message: 'Name must have more than 3 characters' } 
      });
    }

    const nameRegex = /^[a-zA-Z\u00C0-\u017F\s]+$/;
    if (!nameRegex.test(name)) {
      return res.status(400).json({ 
        errors: { message: 'Invalid name format' } 
      });
    }

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { name }
    });

    res.json({ message: 'user account updated' });
  } catch (error) {
    res.status(400).json({ error: 'Error al actualizar cuenta' });
  }
};

// Cambiar contraseña del usuario actual
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    // Aceptar tanto currPassword como currentPassword
    const currentPassword = req.body.currentPassword || req.body.currPassword;
    const { newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ 
        errors: { message: 'Current Password invalid' } 
      });
    }

    if (!newPassword) {
      return res.status(400).json({ 
        errors: { message: 'Invalid newPassword format' } 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        errors: { message: 'Password must have more than 6 characters' } 
      });
    }

    // Obtener usuario con contraseña
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ 
        errors: { message: 'Current Password invalid' } 
      });
    }

    // Hashear y guardar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'user password updated' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(400).json({ error: 'Error al cambiar contraseña' });
  }
};

// Actualizar color del avatar
export const updateAvatarColor = async (req: AuthRequest, res: Response) => {
  try {
    const { color } = req.body;

    const validColors = ['black', 'red', 'blue', 'green', 'yellow', 'violet', 'pink', 'orange', 'darkGray', 'darkBlue'];
    
    if (!color || !validColors.includes(color)) {
      return res.status(400).json({ 
        error: 'Color inválido',
        validColors 
      });
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarColor: color },
      select: {
        id: true,
        avatarColor: true
      }
    });

    res.json({ message: 'avatar color updated', avatarColor: user.avatarColor });
  } catch (error) {
    console.error('Error updating avatar color:', error);
    res.status(400).json({ error: 'Error al actualizar color' });
  }
};
