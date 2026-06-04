import { Router } from 'express';
import * as studySessionController from './study_session.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// All study session routes are protected
router.use(authenticateUser);

router.get('/', studySessionController.getStudySessions);
router.post('/start', studySessionController.startSession);
router.patch('/:id/end', studySessionController.endSession);

export default router;
