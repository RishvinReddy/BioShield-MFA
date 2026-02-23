import express from 'express';
import {
    register,
    loginStep1,
    loginStep2,
    loginStep3,
    refreshToken,
    logout,
    me
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware';

const router = express.Router();

import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
});

// Staged Auth Flow
router.post('/password', loginLimiter, loginStep1);
router.post('/otp', loginStep2);
router.post('/verify', loginStep3);

// Session Management
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.post('/register', register); // Legacy/Admin

export default router;
