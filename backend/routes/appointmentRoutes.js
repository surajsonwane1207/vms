import express from 'express';
import { 
  createAppointment, getAppointments, updateAppointmentStatus, 
  scanQrCode, checkInAppointment, checkOutAppointment 
} from '../controllers/appointmentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.post('/', createAppointment);
router.get('/', getAppointments);
router.patch('/:id/status', updateAppointmentStatus);
router.post('/scan-qr', scanQrCode);
router.post('/:id/check-in', checkInAppointment);
router.post('/:id/check-out', checkOutAppointment);

export default router;
