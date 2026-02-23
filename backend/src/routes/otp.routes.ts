import { Router } from 'express';
import { generateOtp, verifyOtp } from '../controllers/otp.controller';

const router = Router();

router.post('/generate', generateOtp);
router.post('/verify', verifyOtp);

export default router;
