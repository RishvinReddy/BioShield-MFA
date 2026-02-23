import express from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import biometricRoutes from './biometric.routes';
import forensicRoutes from './forensic.routes';
import otpRoutes from './otp.routes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/biometric', biometricRoutes);
router.use('/forensics', forensicRoutes);
router.use('/auth/otp', otpRoutes);

export default router;
