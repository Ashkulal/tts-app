import { Router } from 'express';
import multer from 'multer';
import { convert } from '../controllers/ttsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/convert', authenticateToken, upload.single('pdf'), convert);

export default router;
