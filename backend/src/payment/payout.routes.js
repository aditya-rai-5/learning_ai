import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { requestPayout, getInstructorPayouts, getAdminPayouts, approvePayout } from './payout.controller.js';

const router = Router();

router.use(authenticateUser);

// Instructor routes
router.post('/', (req, res, next) => {
    if (req.user.role !== 'INSTRUCTOR') return res.status(403).json({ error: 'Forbidden' });
    next();
}, requestPayout);

router.get('/my-payouts', (req, res, next) => {
    if (req.user.role !== 'INSTRUCTOR') return res.status(403).json({ error: 'Forbidden' });
    next();
}, getInstructorPayouts);

// Admin routes
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    next();
};

router.get('/admin', requireAdmin, getAdminPayouts);
router.put('/admin/:id/approve', requireAdmin, approvePayout);

export default router;
