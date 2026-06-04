import prisma from '../config/db.config.js';

export const createBookmark = async (userId, data) => {
    const { moduleId, interactionId, note } = data;

    if (!moduleId && !interactionId) {
        throw new Error("Bookmark must be linked to either a module or an interaction");
    }

    return prisma.bookmark.create({
        data: {
            userId,
            moduleId,
            interactionId,
            note
        }
    });
};

export const getUserBookmarks = async (userId) => {
    return prisma.bookmark.findMany({
        where: { userId },
        include: {
            module: { select: { id: true, title: true, courseId: true } },
            interaction: { select: { id: true, message: true, role: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const updateBookmark = async (userId, bookmarkId, note) => {
    const bookmark = await prisma.bookmark.findUnique({ where: { id: bookmarkId } });

    if (!bookmark) throw new Error("Bookmark not found");
    if (bookmark.userId !== userId) throw new Error("Unauthorized");

    return prisma.bookmark.update({
        where: { id: bookmarkId },
        data: { note }
    });
};

export const deleteBookmark = async (userId, bookmarkId) => {
    const bookmark = await prisma.bookmark.findUnique({ where: { id: bookmarkId } });

    if (!bookmark) throw new Error("Bookmark not found");
    if (bookmark.userId !== userId) throw new Error("Unauthorized");

    return prisma.bookmark.delete({
        where: { id: bookmarkId }
    });
};
