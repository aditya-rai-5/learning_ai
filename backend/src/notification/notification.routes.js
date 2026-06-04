import { Router } from 'express';
import * as notificationController from './notification.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// All notification routes are protected
router.use(authenticateUser);

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;
