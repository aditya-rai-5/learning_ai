import prisma from '../config/db.config.js';

export const getUserEnrollments = async (userId) => {
    return prisma.enrollment.findMany({
        where: { userId },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    thumbnailUrl: true,
                    level: true,
                    creator: { select: { name: true } }
                }
            },
            progress: true // Include progress tracking
        },
        orderBy: { enrolledAt: 'desc' }
    });
};

export const getEnrollmentByCourseId = async (userId, courseId) => {
    const enrollment = await prisma.enrollment.findFirst({
        where: { userId, courseId },
        include: {
            course: {
                include: {
                    modules: { orderBy: { order: 'asc' } }
                }
            },
            progress: true
        }
    });

    if (!enrollment) {
        throw new Error("Enrollment not found");
    }

    return enrollment;
};

export const updateModuleProgress = async (userId, courseId, moduleId, progressData) => {
    // 1. Verify Enrollment exists
    const enrollment = await prisma.enrollment.findFirst({
        where: { userId, courseId }
    });

    if (!enrollment) {
        throw new Error("You are not enrolled in this course");
    }

    // 2. Verify Module exists and belongs to the course
    const module = await prisma.module.findFirst({
        where: { id: moduleId, courseId }
    });

    if (!module) {
        throw new Error("Module not found in this course");
    }

    const { status, timeSpentS, lastPosition } = progressData;

    // 3. Upsert ProgressTracking record
    const progressRecord = await prisma.progressTracking.findFirst({
        where: {
            enrollmentId: enrollment.id,
            moduleId: moduleId
        }
    });

    if (progressRecord) {
        // Update existing progress
        return prisma.progressTracking.update({
            where: { id: progressRecord.id },
            data: {
                status: status || progressRecord.status,
                timeSpentS: timeSpentS ? progressRecord.timeSpentS + timeSpentS : progressRecord.timeSpentS,
                lastPosition: lastPosition !== undefined ? String(lastPosition) : progressRecord.lastPosition
            }
        });
    } else {
        // Create new progress
        return prisma.progressTracking.create({
            data: {
                enrollmentId: enrollment.id,
                moduleId: moduleId,
                status: status || "IN_PROGRESS",
                timeSpentS: timeSpentS || 0,
                lastPosition: lastPosition !== undefined ? String(lastPosition) : "0"
            }
        });
    }
};

export const markCourseCompleted = async (userId, courseId) => {
    const enrollment = await prisma.enrollment.findFirst({
        where: { userId, courseId }
    });

    if (!enrollment) {
        throw new Error("Enrollment not found");
    }

    // Optional: Check if all modules have a 'COMPLETED' status in ProgressTracking before allowing this.
    
    return prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { completedAt: new Date() }
    });
};
