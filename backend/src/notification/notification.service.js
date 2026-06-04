import prisma from '../config/db.config.js';

export const createNotification = async (userId, type, payloadJson) => {
    return prisma.notification.create({
        data: {
            userId,
            type,
            payloadJson
        }
    });
};

export const getUserNotifications = async (userId, unreadOnly = false) => {
    const where = { userId };
    if (unreadOnly) {
        where.readAt = null;
    }

    return prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50 // Limit to recent 50
    });
};

export const markAsRead = async (userId, notificationId) => {
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
    });

    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== userId) throw new Error("Unauthorized");

    return prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() }
    });
};

export const markAllAsRead = async (userId) => {
    return prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() }
    });
};

export const deleteNotification = async (userId, notificationId) => {
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
    });

    if (!notification) throw new Error("Notification not found");
    if (notification.userId !== userId) throw new Error("Unauthorized");

    return prisma.notification.delete({
        where: { id: notificationId }
    });
};
