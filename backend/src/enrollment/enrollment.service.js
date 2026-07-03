import prisma from '../config/db.config.js';
import { signModuleBody } from '../utils/s3.utils.js';
import * as userSkillService from '../user_skill/user_skill.service.js';

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
                    creator: { select: { name: true } },
                    _count: { select: { modules: true } }
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
        // Check if user is the course creator or an admin
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { modules: { orderBy: { order: 'asc' } } }
        });
        
        if (!course) {
            throw new Error("Course not found");
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        
        if (course.createdBy === userId || user?.role === 'ADMIN') {
            if (course.modules) {
                course.modules = await Promise.all(course.modules.map(m => signModuleBody(m)));
            }
            // Return a mock enrollment for instructors/admins to view the course
            return {
                id: 'mock-enrollment',
                userId,
                courseId,
                course,
                progress: [],
                enrolledAt: new Date(),
                completedAt: null
            };
        }

        throw new Error("Enrollment not found");
    }

    if (enrollment.course && enrollment.course.modules) {
        enrollment.course.modules = await Promise.all(enrollment.course.modules.map(m => signModuleBody(m)));
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
        await prisma.progressTracking.update({
            where: { id: progressRecord.id },
            data: {
                status: status || progressRecord.status,
                timeSpentS: timeSpentS ? progressRecord.timeSpentS + timeSpentS : progressRecord.timeSpentS,
                lastPosition: lastPosition !== undefined ? String(lastPosition) : progressRecord.lastPosition
            }
        });
    } else {
        // Create new progress
        await prisma.progressTracking.create({
            data: {
                enrollmentId: enrollment.id,
                moduleId: moduleId,
                status: status || "IN_PROGRESS",
                timeSpentS: timeSpentS || 0,
                lastPosition: lastPosition !== undefined ? String(lastPosition) : "0"
            }
        });
    }

    // Check if course is completed
    const courseModulesCount = await prisma.module.count({ where: { courseId } });
    const completedProgressCount = await prisma.progressTracking.count({
        where: {
            enrollmentId: enrollment.id,
            status: 'COMPLETED'
        }
    });

    if (courseModulesCount > 0 && completedProgressCount >= courseModulesCount && !enrollment.completedAt) {
        await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { completedAt: new Date() }
        });

        // Award skills from course tags
        const courseWithTags = await prisma.course.findUnique({
            where: { id: courseId },
            include: { tags: { include: { tag: true } } }
        });

        if (courseWithTags?.tags) {
            for (const courseTag of courseWithTags.tags) {
                // Award 1 proficiency point for each tag on completion
                await userSkillService.addUserSkill(userId, courseTag.tag.name, 1);
            }
        }
    }

    return prisma.progressTracking.findFirst({
        where: {
            enrollmentId: enrollment.id,
            moduleId: moduleId
        }
    });
};

export const markCourseCompleted = async (userId, courseId) => {
    const enrollment = await prisma.enrollment.findFirst({
        where: { userId, courseId }
    });

    if (!enrollment) {
        throw new Error("Enrollment not found");
    }

    // Optional: Check if all modules have a 'COMPLETED' status in ProgressTracking before allowing this.
    
    // Award skills
    const courseWithTags = await prisma.course.findUnique({
        where: { id: courseId },
        include: { tags: { include: { tag: true } } }
    });

    if (courseWithTags?.tags && !enrollment.completedAt) {
        for (const courseTag of courseWithTags.tags) {
            await userSkillService.addUserSkill(userId, courseTag.tag.name, 1);
        }
    }

    return prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { completedAt: new Date() }
    });
};
