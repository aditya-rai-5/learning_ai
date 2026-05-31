import { Router } from 'express';
import * as moduleController from './module.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router({ mergeParams: true });

// Note: Using mergeParams because routes might be nested under course: /api/courses/:courseId/modules

router.post('/', authenticateUser, moduleController.createModule);
router.get('/', authenticateUser, moduleController.getModules);
router.get('/:id', authenticateUser, moduleController.getModule);
router.put('/:id', authenticateUser, moduleController.updateModule);
router.delete('/:id', authenticateUser, moduleController.deleteModule);

export default router;
