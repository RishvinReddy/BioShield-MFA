import express from 'express';
import multer from 'multer';
import { analyzeAlert } from '../controllers/forensic.controller';
import { requireAuth, rateLimiter, authorize } from '../middleware';

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/analyze',
    rateLimiter,
    requireAuth,
    authorize(['ADMIN', 'AUDITOR']),
    upload.single('file'),
    analyzeAlert
);

export default router;
