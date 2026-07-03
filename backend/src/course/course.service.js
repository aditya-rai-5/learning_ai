import prisma from '../config/db.config.js';

// Helper to generate a URL-friendly unique slug from a title
const generateSlug = (title) => {
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${uniqueSuffix}`;
};

export const createCourse = async (userId, courseData) => {
    const { title, description, learningOutcomes, level, tags, thumbnailUrl, accentColor, price, currency, initialModule } = courseData;
    const slug = generateSlug(title);

    const tagConnections = Array.isArray(tags) ? tags.map(tagName => ({
        tag: {
            connectOrCreate: {
                where: { name: tagName.toLowerCase() },
                create: { name: tagName.toLowerCase() }
            }
        }
    })) : [];

    const moduleData = initialModule ? {
        modules: {
            create: [{
                title: initialModule.title,
                contentType: initialModule.contentType || 'TEXT',
                body: initialModule.body,
                durationS: initialModule.durationS || 0,
                order: 1
            }]
        }
    } : {};

    return prisma.course.create({
        data: {
            title,
            slug,
            description,
            learningOutcomes: Array.isArray(learningOutcomes) ? learningOutcomes : [],
            level: level || 'BEGINNER',
            price: price ? parseFloat(price) : 0.00,
            currency: currency || 'USD',
            tags: {
                create: tagConnections
            },
            thumbnailUrl,
            accentColor,
            createdBy: userId,
            ...moduleData
        },
    });
};

export const getAllCourses = async () => {
    return prisma.course.findMany({
        include: {
            creator: {
                select: { id: true, name: true, avatarUrl: true }
            },
            tags: {
                include: { tag: true }
            },
            reviews: {
                select: { rating: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const getCourseByIdOrSlug = async (identifier) => {
    const course = await prisma.course.findFirst({
        where: {
            OR: [
                { id: identifier },
                { slug: identifier }
            ]
        },
        include: {
            creator: { select: { id: true, name: true, avatarUrl: true } },
            tags: { include: { tag: true } },
            modules: { orderBy: { order: 'asc' } },
            reviews: { select: { rating: true } }
        }
    });

    if (!course) {
        throw new Error("Course not found");
    }
    return course;
};

export const updateCourse = async (userId, courseId, updateData) => {
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) {
        throw new Error("Course not found");
    }
    if (course.createdBy !== userId) {
        throw new Error("Unauthorized to modify this course");
    }

    if (updateData.title) {
        updateData.slug = generateSlug(updateData.title);
    }

    const { tags, price, ...restUpdateData } = updateData;

    let tagsUpdate = {};
    if (tags && Array.isArray(tags)) {
        // We delete all existing tag connections for this course, then create new ones
        tagsUpdate = {
            tags: {
                deleteMany: {},
                create: tags.map(tagName => ({
                    tag: {
                        connectOrCreate: {
                            where: { name: tagName.toLowerCase() },
                            create: { name: tagName.toLowerCase() }
                        }
                    }
                }))
            }
        };
    }

    if (price !== undefined) {
        restUpdateData.price = parseFloat(price);
    }

    const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: {
            ...restUpdateData,
            ...tagsUpdate
        },
    });

    // Notify enrolled students about the course details update
    const enrollments = await prisma.enrollment.findMany({ where: { courseId } });
    if (enrollments.length > 0) {
        const notificationsData = enrollments.map(e => ({
            userId: e.userId,
            type: 'COURSE_UPDATE',
            payloadJson: {
                message: `Course details for "${updatedCourse.title}" have been updated.`,
                courseId
            }
        }));
        await prisma.notification.createMany({ data: notificationsData });
    }

    return updatedCourse;
};

export const deleteCourse = async (userId, userRole, courseId) => {
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) {
        throw new Error("Course not found");
    }
    if (course.createdBy !== userId && userRole !== 'ADMIN') {
        throw new Error("Unauthorized to delete this course");
    }

    return prisma.course.delete({
        where: { id: courseId },
    });
};
