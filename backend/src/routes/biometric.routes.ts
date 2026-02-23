import { Router } from 'express';
import { enrollBiometrics, verifyBiometrics } from '../controllers/biometric.controller';

const router = Router();

router.post('/enroll', enrollBiometrics);
router.post('/verify', verifyBiometrics);

export default router;
