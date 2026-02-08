import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getProductPhotos,
  getPhotosByModel,
  uploadProductPhoto,
  deleteProductPhoto,
  createPhotoModel,
  getAvailableModels,
  cleanupOldPhotos
} from '../controllers/productPhoto.controller';
import { authenticate, authorize } from '../middleware/auth';

// Limpieza automática de fotos viejas (cada 6 horas verificar)
setInterval(() => {
  cleanupOldPhotos().catch(err => console.error('Error limpiando fotos:', err));
}, 6 * 60 * 60 * 1000);

// Ejecutar al iniciar también
setTimeout(() => {
  cleanupOldPhotos().catch(err => console.error('Error limpiando fotos:', err));
}, 5000);

const router = Router();

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/products');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (jpg, png, webp)'));
  }
});

router.use(authenticate);

router.get('/', getProductPhotos);
router.get('/models', getAvailableModels);
router.get('/model/:modelName', getPhotosByModel);
router.post('/', authorize('ADMIN', 'MANAGER'), upload.single('photo'), uploadProductPhoto);
router.post('/model', authorize('ADMIN', 'MANAGER'), createPhotoModel);
router.delete('/:id', authorize('ADMIN', 'MANAGER'), deleteProductPhoto);

export default router;
