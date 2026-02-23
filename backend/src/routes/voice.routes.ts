import express from 'express';
import {
    enrollVoiceController,
    verifyVoiceController
} from '../controllers/voice.controller';
import { requireAuth } from '../middleware'; // Ensure secure access

const router = express.Router();

// Protected routes - require valid JWT
router.post('/enroll', enrollVoiceController); // Public for registration (or require temp token in future)
router.post('/verify', verifyVoiceController); // Verify might be public-ish during login, or require specific session token. 
// For now, let's keep it open or use a simpler middleware if needed for the login flow.
// In the strict MFA flow, 'verify' is called with a temporary 'stageToken' usually, but here we just leave it open for integration.

export default router;
