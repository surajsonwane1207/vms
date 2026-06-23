import express from 'express';
import { getAdminAnalytics } from '../controllers/adminController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/analytics', getAdminAnalytics);

export default router;
