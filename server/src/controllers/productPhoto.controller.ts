import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

// Obtener todas las fotos agrupadas por modelo
export const getProductPhotos = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { category } = req.query;

    const where: any = { tenantId, active: true };
    if (category) where.category = category;

    const photos = await prisma.productPhoto.findMany({
      where,
      orderBy: [{ modelName: 'asc' }, { order: 'asc' }]
    });

    // Agrupar por modelo
    const grouped: { [key: string]: any } = {};
    for (const photo of photos) {
      if (!grouped[photo.modelName]) {
        grouped[photo.modelName] = {
          modelName: photo.modelName,
          category: photo.category,
          photos: []
        };
      }
      grouped[photo.modelName].photos.push({
        id: photo.id,
        filename: photo.filename,
        url: photo.url,
        order: photo.order,
        createdAt: photo.createdAt
      });
    }

    res.json({ models: Object.values(grouped) });
  } catch (error) {
    console.error('Error getting product photos:', error);
    res.status(400).json({ error: 'Error al obtener fotos' });
  }
};

// Obtener fotos de un modelo específico
export const getPhotosByModel = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { modelName } = req.params;

    const photos = await prisma.productPhoto.findMany({
      where: {
        tenantId,
        modelName: { contains: modelName },
        active: true
      },
      orderBy: { order: 'asc' }
    });

    res.json({ photos });
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener fotos del modelo' });
  }
};


// Subir foto de producto
export const uploadProductPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { modelName, category = 'PHONE' } = req.body;

    if (!modelName) {
      return res.status(400).json({ error: 'Nombre del modelo requerido' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Archivo requerido' });
    }

    // Contar fotos existentes para el orden
    const existingCount = await prisma.productPhoto.count({
      where: { tenantId, modelName }
    });

    const photo = await prisma.productPhoto.create({
      data: {
        modelName,
        category,
        filename: req.file.filename,
        url: `/uploads/products/${req.file.filename}`,
        order: existingCount,
        tenantId
      }
    });

    res.status(201).json({ photo });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(400).json({ error: 'Error al subir foto' });
  }
};

// Eliminar foto
export const deleteProductPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    // Verificar que la foto pertenece al tenant
    const photo = await prisma.productPhoto.findFirst({ 
      where: { id, tenantId } 
    });
    
    if (!photo) {
      return res.status(404).json({ error: 'Foto no encontrada' });
    }

    // Eliminar archivo físico
    const filePath = path.join(__dirname, '../../uploads/products', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.productPhoto.delete({ where: { id } });

    res.json({ message: 'Foto eliminada' });
  } catch (error) {
    res.status(400).json({ error: 'Error al eliminar foto' });
  }
};

// Crear/actualizar modelo (sin foto, solo metadata)
export const createPhotoModel = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { modelName, category = 'PHONE' } = req.body;

    if (!modelName) {
      return res.status(400).json({ error: 'Nombre del modelo requerido' });
    }

    // Verificar si ya existe
    const existing = await prisma.productPhoto.findFirst({
      where: { tenantId, modelName }
    });

    if (existing) {
      return res.status(400).json({ error: 'El modelo ya existe' });
    }

    res.json({ message: 'Modelo listo para recibir fotos', modelName, category });
  } catch (error) {
    res.status(400).json({ error: 'Error al crear modelo' });
  }
};

// Obtener lista de modelos disponibles (para el bot)
export const getAvailableModels = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;

    const models = await prisma.productPhoto.findMany({
      where: { tenantId, active: true },
      select: { modelName: true, category: true },
      distinct: ['modelName']
    });

    res.json({ models });
  } catch (error) {
    res.status(400).json({ error: 'Error al obtener modelos' });
  }
};


// Limpieza automática de fotos con más de 7 días
export const cleanupOldPhotos = async () => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Buscar fotos viejas
    const oldPhotos = await prisma.productPhoto.findMany({
      where: {
        createdAt: { lt: oneWeekAgo }
      }
    });

    if (oldPhotos.length === 0) {
      console.log('📸 No hay fotos viejas para limpiar');
      return;
    }

    // Eliminar archivos físicos
    for (const photo of oldPhotos) {
      const filePath = path.join(__dirname, '../../uploads/products', photo.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Eliminar de la base de datos
    await prisma.productPhoto.deleteMany({
      where: {
        createdAt: { lt: oneWeekAgo }
      }
    });

    console.log(`📸 Limpieza: ${oldPhotos.length} fotos eliminadas (más de 7 días)`);
  } catch (error) {
    console.error('Error en limpieza de fotos:', error);
  }
};
