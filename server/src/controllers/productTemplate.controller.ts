import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Obtener todas las plantillas
export const getProductTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const { search = '' } = req.query;
    
    const templates = await prisma.productTemplate.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: search as string } },
          { barcode: { contains: search as string } },
          { category: { contains: search as string } },
        ],
      },
      orderBy: { name: 'asc' },
    });

    res.json({ templates });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(400).json({ error: 'Error al obtener plantillas' });
  }
};

// Crear plantilla
export const createProductTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { barcode, name, category, model, price, cost, description } = req.body;

    if (!barcode || !name || !category) {
      return res.status(400).json({ error: 'Código de barras, nombre y categoría son requeridos' });
    }

    // Verificar si ya existe
    const existing = await prisma.productTemplate.findUnique({
      where: { barcode },
    });

    if (existing) {
      return res.status(400).json({ error: 'Ya existe una plantilla con ese código de barras' });
    }

    const template = await prisma.productTemplate.create({
      data: {
        barcode,
        name,
        category,
        model: model || null,
        price: price ? parseFloat(price) : null,
        cost: cost ? parseFloat(cost) : null,
        description: description || null,
      },
    });

    res.status(201).json({ template });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(400).json({ error: 'Error al crear plantilla' });
  }
};

// Actualizar plantilla
export const updateProductTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { barcode, name, category, model, price, cost, description } = req.body;

    const template = await prisma.productTemplate.update({
      where: { id },
      data: {
        barcode,
        name,
        category,
        model: model || null,
        price: price ? parseFloat(price) : null,
        cost: cost ? parseFloat(cost) : null,
        description: description || null,
      },
    });

    res.json({ template });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(400).json({ error: 'Error al actualizar plantilla' });
  }
};

// Eliminar plantilla (soft delete)
export const deleteProductTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.productTemplate.update({
      where: { id },
      data: { active: false },
    });

    res.json({ message: 'Plantilla eliminada' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(400).json({ error: 'Error al eliminar plantilla' });
  }
};
