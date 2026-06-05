import * as studySessionService from './study_session.service.js';

export const startSession = async (req, res) => {
    try {
        const { courseId, moduleId } = req.body;
        const userId = req.user.userId;

        if (!courseId) {
            return res.status(400).json({ error: "courseId is required" });
        }

        const session = await studySessionService.startSession(userId, courseId, moduleId);
        res.status(201).json({ message: "Study session started", session });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const endSession = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const session = await studySessionService.endSession(userId, id);
        res.status(200).json({ message: "Study session ended", session });
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ error: error.message });
        if (error.message.includes("Unauthorized")) return res.status(403).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};

export const getStudySessions = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { courseId } = req.query;

        const sessions = await studySessionService.getUserStudySessions(userId, courseId);
        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
