import express from 'express';
import { getNotifications, readAllNotifications } from '../controllers/notificationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.post('/read-all', readAllNotifications);

export default router;
