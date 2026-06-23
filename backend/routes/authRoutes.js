import express from 'express';
import { 
  registerUser, loginUser, getMe, getHosts, 
  getCompaniesPublic, getInvitation, respondInvitation, 
  bulkInviteEmployees, getSmsGatewayLogs 
} from '../controllers/authController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Publicly available auth endpoints
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/companies', getCompaniesPublic);
router.get('/invitation/:token', getInvitation);
router.post('/invitation/:token/respond', respondInvitation);
router.get('/sms-gateway', getSmsGatewayLogs); // Mock SMS gateway feed

// Secure session endpoints
router.get('/me', authenticateToken, getMe);
router.get('/hosts', authenticateToken, getHosts);
router.post('/users/bulk-invite', authenticateToken, authorizeRoles('admin'), bulkInviteEmployees);

export default router;
