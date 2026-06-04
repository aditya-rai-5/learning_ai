import { Router } from 'express';
import * as discussionController from './discussion.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/threads', discussionController.getThreads);
router.get('/threads/:id', discussionController.getThread);

// Upvote can arguably be public or protected, let's protect it
// to ensure only logged in users upvote.
router.use(authenticateUser);

// Thread routes
router.post('/threads', discussionController.createThread);
router.put('/threads/:id', discussionController.updateThread);
router.delete('/threads/:id', discussionController.deleteThread);
router.patch('/threads/:id/pin', discussionController.togglePin);

// Reply routes
router.post('/threads/:threadId/replies', discussionController.createReply);
router.put('/replies/:id', discussionController.updateReply);
router.delete('/replies/:id', discussionController.deleteReply);
router.patch('/replies/:id/answer', discussionController.markAsAnswer);
router.post('/replies/:id/upvote', discussionController.upvoteReply);

export default router;
