import { Router } from 'express';
import * as certificateController from './certificate.controller.js';
import { authenticateUser } from '../../middleware/auth.middleware.js';

const router = Router();

// Issue a certificate for a completed course
router.post('/courses/:courseId/certificates', authenticateUser, certificateController.issueCertificate);

// Get a specific certificate by ID
router.get('/certificates/:certificateId', authenticateUser, certificateController.getCertificate);

// Get all certificates for the logged-in user
router.get('/my-certificates', authenticateUser, certificateController.getMyCertificates);

// Public route to verify a certificate by hash
router.get('/certificates/verify/:hash', certificateController.verifyCertificate);

export default router;
