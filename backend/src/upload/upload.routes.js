import { Router } from 'express';
import { authenticateUser } from '../../middleware/auth.middleware.js';
import { videoUpload, documentUpload } from '../../middleware/upload.middleware.js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

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
        // We return the s3 object key so it can be stored in the DB, not the public URL.
        res.status(200).json({ url: req.file.key });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/document', requireInstructor, documentUpload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No document file provided" });
        }
        res.status(200).json({ url: req.file.key });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to generate a signed URL for reading a file
router.post('/signed-url', async (req, res) => {
    try {
        const { key } = req.body;
        if (!key) {
            return res.status(400).json({ error: "No object key provided" });
        }
        
        // Basic security check: if it's already an HTTP URL (e.g., from old data or external), just return it
        if (key.startsWith('http')) {
            return res.json({ url: key });
        }

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: key,
        });

        // Signed URL expires in 1 hour (3600 seconds)
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        res.status(200).json({ url: signedUrl });
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
