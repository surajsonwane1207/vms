import express from 'express';
import { registerUser, loginUser, getMe, getHosts } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authenticateToken, getMe);
router.get('/hosts', authenticateToken, getHosts);

export default router;
