import { Router } from 'express';
import * as bookmarkController from './bookmark.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// All bookmark routes are protected
router.use(authenticateUser);

router.post('/', bookmarkController.createBookmark);
router.get('/', bookmarkController.getBookmarks);
router.put('/:id', bookmarkController.updateBookmark);
router.delete('/:id', bookmarkController.deleteBookmark);

export default router;
