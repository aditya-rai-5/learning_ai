import * as notificationService from './notification.service.js';

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        const unreadOnly = req.query.unread === 'true';
        const rawNotifications = await notificationService.getUserNotifications(userId, unreadOnly);
        
        const notifications = rawNotifications.map(n => ({
            ...n,
            message: n.payloadJson?.message || 'New notification',
            isRead: !!n.readAt
        }));

        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        const notification = await notificationService.markAsRead(userId, id);
        res.status(200).json({ message: "Notification marked as read", notification });
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ error: error.message });
        if (error.message.includes("Unauthorized")) return res.status(403).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        await notificationService.markAllAsRead(userId);
        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;
        await notificationService.deleteNotification(userId, id);
        res.status(200).json({ message: "Notification deleted successfully" });
    } catch (error) {
        if (error.message.includes("not found")) return res.status(404).json({ error: error.message });
        if (error.message.includes("Unauthorized")) return res.status(403).json({ error: error.message });
        res.status(500).json({ error: error.message });
    }
};
