import * as learningPathService from './learning_path.service.js';

export const createLearningPath = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const data = req.body;

        const path = await learningPathService.createLearningPath(userId, userRole, data);
        res.status(201).json({ message: "Learning path created successfully", path });
    } catch (error) {
        if (error.message.includes("Unauthorized")) {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const getAllLearningPaths = async (req, res) => {
    try {
        const paths = await learningPathService.getAllLearningPaths();
        res.status(200).json(paths);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getLearningPathById = async (req, res) => {
    try {
        const { pathId } = req.params;
        const path = await learningPathService.getLearningPathById(pathId);
        res.status(200).json(path);
    } catch (error) {
        if (error.message === "Learning path not found") {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const updateLearningPath = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { pathId } = req.params;
        const data = req.body;

        const path = await learningPathService.updateLearningPath(userId, userRole, pathId, data);
        res.status(200).json({ message: "Learning path updated successfully", path });
    } catch (error) {
        if (error.message === "Learning path not found") {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes("Unauthorized")) {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const deleteLearningPath = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { pathId } = req.params;

        await learningPathService.deleteLearningPath(userId, userRole, pathId);
        res.status(200).json({ message: "Learning path deleted successfully" });
    } catch (error) {
        if (error.message === "Learning path not found") {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes("Unauthorized")) {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};
