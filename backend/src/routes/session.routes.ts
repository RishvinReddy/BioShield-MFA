import { Router } from 'express';
import { sendHeartbeat, logoutSession } from '../controllers/session.controller';

const router = Router();

router.post('/heartbeat', sendHeartbeat);
router.post('/logout', logoutSession);

export default router;
