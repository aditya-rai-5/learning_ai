import prisma from '../config/db.config.js';

export const startSession = async (userId, courseId) => {
    // Check for an already active session for this user (where endedAt is the same as startedAt or in the future if pre-set)
    // For simplicity, we create a new session record when started.
    
    return prisma.studySession.create({
        data: {
            userId,
            courseId,
            startedAt: new Date(),
            endedAt: new Date(), // Will be updated on end
            durationS: 0
        }
    });
};

export const endSession = async (userId, sessionId) => {
    const session = await prisma.studySession.findUnique({
        where: { id: sessionId }
    });

    if (!session) throw new Error("Session not found");
    if (session.userId !== userId) throw new Error("Unauthorized");

    const endedAt = new Date();
    const durationS = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000);

    return prisma.studySession.update({
        where: { id: sessionId },
        data: {
            endedAt,
            durationS
        }
    });
};

export const getUserStudySessions = async (userId, courseId) => {
    const where = { userId };
    if (courseId) {
        where.courseId = courseId;
    }

    return prisma.studySession.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        include: {
            course: { select: { title: true } }
        }
    });
};
