import express from 'express';
import { getAdminAnalytics, createCompany, getCompanies } from '../controllers/adminController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// Analytics: available for both company admin (scoped) and superadmin (global scope)
router.get('/analytics', authorizeRoles('admin', 'superadmin'), getAdminAnalytics);

// Tenant Company management: restricted to global superadmin role
router.post('/companies', authorizeRoles('superadmin'), createCompany);
router.get('/companies', authorizeRoles('superadmin'), getCompanies);

export default router;
