import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { videoUpload, documentUpload } from '../../middleware/upload.middleware.js';

const router = Router();

// Protect all upload routes
router.use(authenticateUser);

// Ensure user is an instructor or admin (optional but recommended for course creation)
const requireInstructor = (req, res, next) => {
    if (req.user.role !== 'INSTRUCTOR' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: "Only instructors can upload course content" });
    }
    next();
};

router.post('/video', requireInstructor, videoUpload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No video file provided" });
        }
        // req.file.location is populated by multer-s3 and contains the public URL
        res.status(200).json({ url: req.file.location });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/document', requireInstructor, documentUpload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No document file provided" });
        }
        res.status(200).json({ url: req.file.location });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generic error handler for multer errors (e.g. file too large, invalid type)
router.use((err, req, res, next) => {
    if (err.name === 'MulterError') {
        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});

export default router;
