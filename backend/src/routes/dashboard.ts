import { Router } from 'express';
import { getHistory, getStats } from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/history', authenticateToken, getHistory);
router.get('/stats', authenticateToken, getStats);

export default router;
