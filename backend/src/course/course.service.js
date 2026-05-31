import prisma from '../config/db.config.js';

// Helper to generate a URL-friendly unique slug from a title
const generateSlug = (title) => {
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${uniqueSuffix}`;
};

export const createCourse = async (userId, courseData) => {
    const { title, description, level, tags, thumbnailUrl, price, currency } = courseData;
    const slug = generateSlug(title);

    const tagConnections = Array.isArray(tags) ? tags.map(tagName => ({
        tag: {
            connectOrCreate: {
                where: { name: tagName.toLowerCase() },
                create: { name: tagName.toLowerCase() }
            }
        }
    })) : [];

    return prisma.course.create({
        data: {
            title,
            slug,
            description,
            level: level || 'BEGINNER',
            price: price ? parseFloat(price) : 0.00,
            currency: currency || 'USD',
            tags: {
                create: tagConnections
            },
            thumbnailUrl,
            createdBy: userId,
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
            modules: { orderBy: { order: 'asc' } }
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

    return prisma.course.update({
        where: { id: courseId },
        data: {
            ...restUpdateData,
            ...tagsUpdate
        },
    });
};

export const deleteCourse = async (userId, courseId) => {
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) {
        throw new Error("Course not found");
    }
    if (course.createdBy !== userId) {
        throw new Error("Unauthorized to delete this course");
    }

    return prisma.course.delete({
        where: { id: courseId },
    });
};
