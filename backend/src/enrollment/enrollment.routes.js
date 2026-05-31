import { Router } from 'express';
import * as enrollmentController from './enrollment.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// All enrollment routes require authentication
router.use(authenticateUser);

// Get all courses the user is enrolled in
router.get('/', enrollmentController.getMyEnrollments);

// Get specific enrollment details (including progress)
router.get('/:courseId', enrollmentController.getCourseEnrollment);

// Mark course as completed
router.post('/:courseId/complete', enrollmentController.completeCourse);

// Update progress for a specific module within an enrollment
router.post('/:courseId/progress/:moduleId', enrollmentController.updateProgress);

export default router;
