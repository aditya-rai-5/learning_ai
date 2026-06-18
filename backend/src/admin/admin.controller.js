import * as adminService from './admin.service.js';

export const getSystemStats = async (req, res) => {
    try {
        const stats = await adminService.getSystemStats();
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const data = await adminService.getAllUsers(page, limit);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        await adminService.deleteUser(id);
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete user. Ensure all dependencies are handled." });
    }
};

export const getAllCourses = async (req, res) => {
    try {
        const courses = await adminService.getAllCourses();
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const sendNotification = async (req, res) => {
    try {
        const senderId = req.user.userId;
        const { targetUserId, message, type } = req.body;
        
        if (!targetUserId || !message) {
            return res.status(400).json({ error: "Target user ID and message are required" });
        }

        const notification = await adminService.sendNotification(senderId, targetUserId, message, type);
        res.status(201).json({ message: "Notification sent", notification });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllThreads = async (req, res) => {
    try {
        const threads = await adminService.getAllThreads();
        res.status(200).json(threads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
