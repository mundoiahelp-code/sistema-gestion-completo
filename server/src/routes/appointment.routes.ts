import { Router } from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  attendAppointment,
  cancelAppointment,
  deleteAppointment,
} from '../controllers/appointment.controller';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener todos los turnos (con filtros)
router.get('/', getAppointments);

// Obtener un turno por ID
router.get('/:id', getAppointmentById);

// Crear turno (ADMIN, MANAGER, SELLER)
router.post('/', checkRole(['ADMIN', 'MANAGER', 'SELLER']), createAppointment);

// Actualizar turno (ADMIN, MANAGER, SELLER)
router.patch('/:id', checkRole(['ADMIN', 'MANAGER', 'SELLER']), updateAppointment);

// Marcar como atendido (ADMIN, MANAGER, SELLER)
router.post('/:id/attend', checkRole(['ADMIN', 'MANAGER', 'SELLER']), attendAppointment);

// Cancelar turno (ADMIN, MANAGER, SELLER)
router.post('/:id/cancel', checkRole(['ADMIN', 'MANAGER', 'SELLER']), cancelAppointment);

// Eliminar turno (solo ADMIN)
router.delete('/:id', checkRole(['ADMIN']), deleteAppointment);

export default router;
