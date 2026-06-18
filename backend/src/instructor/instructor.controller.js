import * as instructorService from './instructor.service.js';

export const getOverview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;

        if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
            return res.status(403).json({ error: "Only instructors can access this data" });
        }

        const overview = await instructorService.getInstructorOverview(userId);
        res.status(200).json(overview);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getMyCourses = async (req, res) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;

        if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
            return res.status(403).json({ error: "Only instructors can access this data" });
        }

        const courses = await instructorService.getInstructorCourses(userId);
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getQA = async (req, res) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;

        if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
            return res.status(403).json({ error: "Only instructors can access this data" });
        }

        const qa = await instructorService.getInstructorQA(userId);
        res.status(200).json(qa);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getPublicProfile = async (req, res) => {
    try {
        const { instructorId } = req.params;
        const profile = await instructorService.getPublicInstructorProfile(instructorId);
        res.status(200).json(profile);
    } catch (error) {
        if (error.message === "Instructor not found") {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};
