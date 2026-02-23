import { Router } from 'express';
import { requireAuth, authorize } from '../middleware';
import {
    getUsers,
    unlockUser,
    resetUserPassword,
    getAuditLogs,
    getSuspiciousActivity,
    createUser
} from '../controllers/admin.controller';

const router = Router();

// Protect all routes with JWT and ADMIN role
router.use(requireAuth);
router.use(authorize(['ADMIN']));

// User Management
router.get('/users', getUsers);
router.post('/users', createUser); // Create User
router.post('/users/:id/unlock', unlockUser);
router.post('/users/:id/reset-password', resetUserPassword);

// Audit & Reporting
router.get('/audit', getAuditLogs);
router.get('/suspicious', getSuspiciousActivity);

export default router;
