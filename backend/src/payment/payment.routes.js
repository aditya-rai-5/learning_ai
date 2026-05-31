import { Router } from 'express';
import * as paymentController from './payment.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// Endpoint for students to enroll (or initiate purchase)
router.post('/enroll/:courseId', authenticateUser, paymentController.enrollOrPurchase);

// Endpoint for instructors to view their earnings
router.get('/earnings', authenticateUser, paymentController.getInstructorEarnings);

// Webhook simulation endpoint (usually this is public but verified via signatures)
router.post('/webhook', paymentController.simulatePaymentWebhook);

export default router;