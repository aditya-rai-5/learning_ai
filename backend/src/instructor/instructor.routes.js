import { Router } from 'express';
import * as instructorController from './instructor.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// Public route
router.get('/profile/:instructorId', instructorController.getPublicProfile);

// Protected instructor routes
router.use(authenticateUser);

router.get('/overview', instructorController.getOverview);
router.get('/courses', instructorController.getMyCourses);
router.get('/qa', instructorController.getQA);

export default router;
