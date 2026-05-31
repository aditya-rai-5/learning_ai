import * as enrollmentService from './enrollment.service.js';

export const getMyEnrollments = async (req, res) => {
    try {
        const userId = req.user.userId;
        const enrollments = await enrollmentService.getUserEnrollments(userId);
        res.status(200).json(enrollments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCourseEnrollment = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { courseId } = req.params;
        const enrollment = await enrollmentService.getEnrollmentByCourseId(userId, courseId);
        res.status(200).json(enrollment);
    } catch (error) {
        if (error.message.includes("not found")) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const updateProgress = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { courseId, moduleId } = req.params;
        
        const progress = await enrollmentService.updateModuleProgress(userId, courseId, moduleId, req.body);
        res.status(200).json({ message: "Progress updated", progress });
    } catch (error) {
        if (error.message.includes("not enrolled") || error.message.includes("not found")) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const completeCourse = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { courseId } = req.params;

        const enrollment = await enrollmentService.markCourseCompleted(userId, courseId);
        res.status(200).json({ message: "Course marked as completed", enrollment });
    } catch (error) {
        if (error.message.includes("not found")) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};
