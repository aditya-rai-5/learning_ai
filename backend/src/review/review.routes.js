import { Router } from 'express';
import * as reviewController from './review.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

// Note: This router is expected to be mounted at /api/courses/:courseId/reviews
// Or standalone /api/reviews for update/delete where courseId is not in URL
const router = Router({ mergeParams: true });

// Public routes
router.get('/', reviewController.getCourseReviews);

// Protected routes
router.use(authenticateUser);
router.post('/', reviewController.createReview);

// For update and delete, we might prefer standalone routes like /api/reviews/:id
// But they can also live here if we pass courseId and id. Let's make update/delete 
// not strictly require courseId in path if they just use review ID, but since router 
// is mounted at /courses/:courseId/reviews, they will be /courses/:courseId/reviews/:id
router.put('/:id', reviewController.updateReview);
router.delete('/:id', reviewController.deleteReview);

export default router;
