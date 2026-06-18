import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// Protect all admin routes
router.use(authenticateUser);

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: "Access denied. Admin role required." });
    }
    next();
};

router.use(requireAdmin);

router.get('/stats', adminController.getSystemStats);

// Users
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);

// Courses
router.get('/courses', adminController.getAllCourses);
// Course deletion happens via course routes, where we already added userRole logic to bypass owner check
// i.e. DELETE /api/courses/:id 

// Community
router.get('/threads', adminController.getAllThreads);
// Thread/Reply deletion happens via discussion routes where we added userRole logic

// Notifications
router.post('/notify', adminController.sendNotification);

export default router;
