import { Router } from 'express';
import * as assessmentController from './assessment.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// --- INSTRUCTOR ENDPOINTS ---
// Ideally, we'd have a roleCheck middleware (e.g., `authorizeRoles('INSTRUCTOR', 'ADMIN')`)
// For simplicity in this structure, we handle basic auth and let the controller/service validate ownership if needed.

// Create an assessment for a course (optionally linked to a module)
router.post('/courses/:courseId/modules/:moduleId/assessments', authenticateUser, assessmentController.createAssessment);
router.post('/courses/:courseId/assessments', authenticateUser, assessmentController.createAssessment);

// Add a question to an assessment
router.post('/assessments/:assessmentId/questions', authenticateUser, assessmentController.addQuestion);

// Get assessment details (including answers, for instructors)
router.get('/assessments/:assessmentId/instructor', authenticateUser, assessmentController.getAssessmentForInstructor);


// --- STUDENT ENDPOINTS ---

// Get assessment details (excluding answers)
router.get('/assessments/:assessmentId', authenticateUser, assessmentController.getAssessmentForStudent);

// Start an attempt
router.post('/assessments/:assessmentId/attempts', authenticateUser, assessmentController.startAttempt);

// Submit an attempt
router.post('/attempts/:attemptId/submit', authenticateUser, assessmentController.submitAttempt);

// Get student attempts for an assessment
router.get('/assessments/:assessmentId/attempts', authenticateUser, assessmentController.getStudentAttempts);

export default router;
