import { Router } from 'express';
import * as learningPathController from './learning_path.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// Public / general endpoints
router.get('/learning-paths', learningPathController.getAllLearningPaths);
router.get('/learning-paths/:pathId', learningPathController.getLearningPathById);

// Instructor / Admin endpoints
router.post('/learning-paths', authenticateUser, learningPathController.createLearningPath);
router.put('/learning-paths/:pathId', authenticateUser, learningPathController.updateLearningPath);
router.delete('/learning-paths/:pathId', authenticateUser, learningPathController.deleteLearningPath);

export default router;
