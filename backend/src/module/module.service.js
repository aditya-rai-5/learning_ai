import prisma from '../config/db.config.js';

// Helper to verify user access to course modules
const verifyAccess = async (user, courseId, courseRecord = null) => {
    // 1. Admins have full access
    if (user.role === 'ADMIN') return true;
    
    // 2. Instructors have access to their own courses
    let course = courseRecord;
    if (!course) {
        course = await prisma.course.findUnique({
            where: { id: courseId },
            select: { createdBy: true }
        });
        if (!course) throw new Error("Course not found");
    }
    
    if (course.createdBy === user.userId) return true;

    // 3. Students must have an active enrollment
    const enrollment = await prisma.enrollment.findFirst({
        where: {
            userId: user.userId,
            courseId: courseId
        }
    });

    if (!enrollment) {
        throw new Error("Forbidden: You must enroll in this course to view its content.");
    }
    
    return true;
};

export const createModule = async (userId, courseId, moduleData) => {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
        throw new Error("Course not found");
    }
    if (course.createdBy !== userId) {
        throw new Error("Unauthorized: You do not own this course");
    }

    const { title, contentType, body, order, durationS } = moduleData;

    return prisma.$transaction(async (tx) => {
        const newModule = await tx.module.create({
            data: {
                courseId,
                title,
                contentType,
                body,
                order: order || 1,
                durationS: durationS || 0,
            }
        });

        await tx.contentVersion.create({
            data: {
                moduleId: newModule.id,
                version: 1,
                body: newModule.body,
                createdBy: userId
            }
        });

        // Whenever a new module is added, reset course completion status
        await tx.enrollment.updateMany({
            where: { courseId },
            data: { completedAt: null }
        });

        // Notify enrolled students
        const enrollments = await tx.enrollment.findMany({ where: { courseId } });
        if (enrollments.length > 0) {
            const notificationsData = enrollments.map(e => ({
                userId: e.userId,
                type: 'COURSE_UPDATE',
                payloadJson: {
                    message: `A new module "${title}" has been added to the course "${course.title}".`,
                    courseId,
                    moduleId: newModule.id
                }
            }));
            await tx.notification.createMany({ data: notificationsData });
        }

        return newModule;
    });
};

export const getModulesByCourseId = async (courseId, user) => {
    await verifyAccess(user, courseId);

    return prisma.module.findMany({
        where: { courseId },
        orderBy: { order: 'asc' }
    });
};

export const getModuleById = async (moduleId, user) => {
    const module = await prisma.module.findUnique({
        where: { id: moduleId },
        include: {
            course: { select: { id: true, createdBy: true } },
            versions: {
                orderBy: { version: 'desc' }
            }
        }
    });

    if (!module) {
        throw new Error("Module not found");
    }
    
    await verifyAccess(user, module.course.id, module.course);

    return module;
};

export const updateModule = async (userId, moduleId, updateData) => {
    const existingModule = await prisma.module.findUnique({
        where: { id: moduleId },
        include: { course: true, versions: { orderBy: { version: 'desc' }, take: 1 } }
    });

    if (!existingModule) {
        throw new Error("Module not found");
    }
    if (existingModule.course.createdBy !== userId) {
        throw new Error("Unauthorized to modify this module");
    }

    return prisma.$transaction(async (tx) => {
        const updatedModule = await tx.module.update({
            where: { id: moduleId },
            data: {
                title: updateData.title,
                contentType: updateData.contentType,
                body: updateData.body,
                order: updateData.order,
                durationS: updateData.durationS
            }
        });

        if (updateData.body && updateData.body !== existingModule.body) {
            const latestVersionNumber = existingModule.versions.length > 0 ? existingModule.versions[0].version : 0;
            await tx.contentVersion.create({
                data: {
                    moduleId: updatedModule.id,
                    version: latestVersionNumber + 1,
                    body: updateData.body,
                    createdBy: userId
                }
            });

            // Notify enrolled students about the content update
            const enrollments = await tx.enrollment.findMany({ where: { courseId: existingModule.courseId } });
            if (enrollments.length > 0) {
                const notificationsData = enrollments.map(e => ({
                    userId: e.userId,
                    type: 'COURSE_UPDATE',
                    payloadJson: {
                        message: `The module "${updatedModule.title}" in course "${existingModule.course.title}" has been updated.`,
                        courseId: existingModule.courseId,
                        moduleId: updatedModule.id
                    }
                }));
                await tx.notification.createMany({ data: notificationsData });
            }
        }

        return updatedModule;
    });
};

export const deleteModule = async (userId, moduleId) => {
    const existingModule = await prisma.module.findUnique({
        where: { id: moduleId },
        include: { course: true }
    });

    if (!existingModule) {
        throw new Error("Module not found");
    }
    if (existingModule.course.createdBy !== userId) {
        throw new Error("Unauthorized to delete this module");
    }

    return prisma.$transaction(async (tx) => {
        await tx.contentVersion.deleteMany({
            where: { moduleId }
        });

        return tx.module.delete({
            where: { id: moduleId }
        });
    });
};