import prisma from '../config/db.config.js';

// --- Threads ---

export const createThread = async (authorId, moduleId, title, body) => {
    return prisma.discussionThread.create({
        data: {
            authorId,
            moduleId,
            title,
            body
        }
    });
};

export const getThreadsByModule = async (moduleId) => {
    return prisma.discussionThread.findMany({
        where: { moduleId },
        include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { replies: true } }
        },
        orderBy: [
            { pinned: 'desc' },
            { createdAt: 'desc' }
        ]
    });
};

export const getThreadById = async (threadId) => {
    const thread = await prisma.discussionThread.findUnique({
        where: { id: threadId },
        include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            replies: {
                include: {
                    author: { select: { id: true, name: true, avatarUrl: true } }
                },
                orderBy: [
                    { isAnswer: 'desc' },
                    { createdAt: 'asc' }
                ]
            }
        }
    });
    if (!thread) throw new Error("Thread not found");
    return thread;
};

export const updateThread = async (userId, threadId, updateData) => {
    const thread = await prisma.discussionThread.findUnique({ where: { id: threadId } });
    if (!thread) throw new Error("Thread not found");
    if (thread.authorId !== userId) throw new Error("Unauthorized");

    return prisma.discussionThread.update({
        where: { id: threadId },
        data: updateData
    });
};

export const deleteThread = async (userId, threadId) => {
    const thread = await prisma.discussionThread.findUnique({ where: { id: threadId } });
    if (!thread) throw new Error("Thread not found");
    if (thread.authorId !== userId) throw new Error("Unauthorized");

    return prisma.discussionThread.delete({
        where: { id: threadId }
    });
};

export const togglePinThread = async (userId, threadId, pinned) => {
    // In a real scenario, verify if user is an INSTRUCTOR of the course
    // For simplicity, checking if thread exists
    const thread = await prisma.discussionThread.findUnique({ where: { id: threadId } });
    if (!thread) throw new Error("Thread not found");

    return prisma.discussionThread.update({
        where: { id: threadId },
        data: { pinned }
    });
};

// --- Replies ---

export const createReply = async (authorId, threadId, body) => {
    return prisma.discussionReply.create({
        data: {
            authorId,
            threadId,
            body
        }
    });
};

export const updateReply = async (userId, replyId, body) => {
    const reply = await prisma.discussionReply.findUnique({ where: { id: replyId } });
    if (!reply) throw new Error("Reply not found");
    if (reply.authorId !== userId) throw new Error("Unauthorized");

    return prisma.discussionReply.update({
        where: { id: replyId },
        data: { body }
    });
};

export const deleteReply = async (userId, replyId) => {
    const reply = await prisma.discussionReply.findUnique({ where: { id: replyId } });
    if (!reply) throw new Error("Reply not found");
    if (reply.authorId !== userId) throw new Error("Unauthorized");

    return prisma.discussionReply.delete({
        where: { id: replyId }
    });
};

export const markAsAnswer = async (userId, replyId) => {
    const reply = await prisma.discussionReply.findUnique({
        where: { id: replyId },
        include: { thread: true }
    });

    if (!reply) throw new Error("Reply not found");
    if (reply.thread.authorId !== userId) {
        throw new Error("Only the thread author can mark an answer");
    }

    // First unmark any existing answer for this thread
    await prisma.discussionReply.updateMany({
        where: { threadId: reply.threadId, isAnswer: true },
        data: { isAnswer: false }
    });

    // Mark the new answer
    return prisma.discussionReply.update({
        where: { id: replyId },
        data: { isAnswer: true }
    });
};

export const upvoteReply = async (replyId) => {
    // Note: Simple increment. A real system would track who upvoted to prevent duplicates.
    return prisma.discussionReply.update({
        where: { id: replyId },
        data: { upvotes: { increment: 1 } }
    });
};
