import * as discussionService from './discussion.service.js';

// --- Threads ---

export const createThread = async (req, res) => {
    try {
        const { moduleId, title, body } = req.body;
        const userId = req.user.userId;

        if (!moduleId || !title || !body) {
            return res.status(400).json({ error: "Module ID, title, and body are required" });
        }

        const thread = await discussionService.createThread(userId, moduleId, title, body);
        res.status(201).json({ message: "Thread created successfully", thread });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getThreads = async (req, res) => {
    try {
        const { moduleId } = req.query; // e.g. /api/threads?moduleId=123
        if (!moduleId) {
            return res.status(400).json({ error: "moduleId query parameter is required" });
        }
        const threads = await discussionService.getThreadsByModule(moduleId);
        res.status(200).json(threads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getThread = async (req, res) => {
    try {
        const { id } = req.params;
        const thread = await discussionService.getThreadById(id);
        res.status(200).json(thread);
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};

export const updateThread = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const thread = await discussionService.updateThread(userId, id, req.body);
        res.status(200).json({ message: "Thread updated successfully", thread });
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ error: error.message });
        if (error.message.includes("Unauthorized")) return res.status(403).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};

export const deleteThread = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        await discussionService.deleteThread(userId, id);
        res.status(200).json({ message: "Thread deleted successfully" });
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ error: error.message });
        if (error.message.includes("Unauthorized")) return res.status(403).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};

export const togglePin = async (req, res) => {
    try {
        const { id } = req.params;
        const { pinned } = req.body;
        const userId = req.user.userId;
        const thread = await discussionService.togglePinThread(userId, id, pinned);
        res.status(200).json({ message: "Thread pin status updated", thread });
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};

// --- Replies ---

export const createReply = async (req, res) => {
    try {
        const { threadId } = req.params;
        const { body } = req.body;
        const userId = req.user.userId;

        if (!body) {
            return res.status(400).json({ error: "Reply body is required" });
        }

        const reply = await discussionService.createReply(userId, threadId, body);
        res.status(201).json({ message: "Reply added successfully", reply });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateReply = async (req, res) => {
    try {
        const { id } = req.params;
        const { body } = req.body;
        const userId = req.user.userId;

        const reply = await discussionService.updateReply(userId, id, body);
        res.status(200).json({ message: "Reply updated successfully", reply });
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ error: error.message });
        if (error.message.includes("Unauthorized")) return res.status(403).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};

export const deleteReply = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        await discussionService.deleteReply(userId, id);
        res.status(200).json({ message: "Reply deleted successfully" });
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ error: error.message });
        if (error.message.includes("Unauthorized")) return res.status(403).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};

export const markAsAnswer = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const reply = await discussionService.markAsAnswer(userId, id);
        res.status(200).json({ message: "Reply marked as answer", reply });
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ error: error.message });
        if (error.message.includes("Only the thread author")) return res.status(403).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};

export const upvoteReply = async (req, res) => {
    try {
        const { id } = req.params;
        const reply = await discussionService.upvoteReply(id);
        res.status(200).json({ message: "Reply upvoted", reply });
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};
