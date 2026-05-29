import prisma from '../config/db.config.js';

// Helper to generate a URL-friendly unique slug from a title
const generateSlug = (title) => {
    const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${uniqueSuffix}`;
};

export const createCourse = async (userId, courseData) => {
    const { title, description, level, tags, thumbnailUrl } = courseData;
    const slug = generateSlug(title);

    return prisma.course.create({
        data: {
            title,
            slug,
            description,
            level: level || 'BEGINNER',
            tags: tags || [],
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

    // If title is updated, optionally update slug, but usually it's safer to keep the old one or generate a new unique one.
    // We'll generate a new one if title changes.
    if (updateData.title) {
        updateData.slug = generateSlug(updateData.title);
    }

    return prisma.course.update({
        where: { id: courseId },
        data: updateData,
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
