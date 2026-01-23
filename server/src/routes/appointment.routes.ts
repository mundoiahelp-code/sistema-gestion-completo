import { Router } from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getTodayAppointments,
  updateAppointmentStatus,
  getAvailableSlots,
} from '../controllers/appointment.controller';
import { authenticate } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de turnos
router.get('/', getAppointments);
router.get('/today', getTodayAppointments);
router.get('/available-slots', getAvailableSlots);
router.get('/:id', getAppointmentById);
router.post('/', auditLog('CREATE', 'APPOINTMENT'), createAppointment);
router.put('/:id', auditLog('UPDATE', 'APPOINTMENT'), updateAppointment);
router.patch('/:id/status', auditLog('UPDATE', 'APPOINTMENT'), updateAppointmentStatus);
router.delete('/:id', auditLog('DELETE', 'APPOINTMENT'), deleteAppointment);

export default router;
