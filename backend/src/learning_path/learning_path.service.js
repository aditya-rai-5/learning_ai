import prisma from '../config/db.config.js';

// Helper to handle tag connections
const buildTagConnections = (tags) => {
    if (!tags || !Array.isArray(tags)) return [];
    return tags.map(tagName => ({
        tag: {
            connectOrCreate: {
                where: { name: tagName.toLowerCase() },
                create: { name: tagName.toLowerCase() }
            }
        }
    }));
};

export const createLearningPath = async (userId, userRole, data) => {
    if (userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN') {
        throw new Error("Unauthorized: Only instructors or admins can create learning paths");
    }

    const { title, description, tags, courses, accentColor } = data;
    // courses expected as: [{ courseId: "...", order: 1 }, { courseId: "...", order: 2 }]

    const tagConnections = buildTagConnections(tags);

    return prisma.learningPath.create({
        data: {
            title,
            description,
            accentColor,
            createdBy: userId,
            tags: tags || [], // storing scalar array as per schema
            learningPathTags: { create: tagConnections }, // relational tags
            courses: {
                create: courses?.map(c => ({
                    courseId: c.courseId,
                    order: c.order
                })) || []
            }
        },
        include: {
            courses: { include: { course: { select: { title: true, thumbnailUrl: true } } }, orderBy: { order: 'asc' } },
            learningPathTags: { include: { tag: true } }
        }
    });
};

export const getAllLearningPaths = async () => {
    return prisma.learningPath.findMany({
        include: {
            creator: { select: { id: true, name: true, avatarUrl: true } },
            courses: { 
                include: { course: { select: { id: true, title: true, slug: true, thumbnailUrl: true, level: true } } },
                orderBy: { order: 'asc' }
            },
            learningPathTags: { include: { tag: true } }
        },
        orderBy: { title: 'asc' } // No createdAt on LearningPath in schema, order by title
    });
};

export const getLearningPathById = async (pathId) => {
    const path = await prisma.learningPath.findUnique({
        where: { id: pathId },
        include: {
            creator: { select: { id: true, name: true, avatarUrl: true } },
            courses: { 
                include: { 
                    course: { 
                        select: { id: true, title: true, slug: true, description: true, thumbnailUrl: true, level: true, price: true } 
                    } 
                },
                orderBy: { order: 'asc' }
            },
            learningPathTags: { include: { tag: true } }
        }
    });

    if (!path) throw new Error("Learning path not found");
    return path;
};

export const updateLearningPath = async (userId, userRole, pathId, data) => {
    const existingPath = await prisma.learningPath.findUnique({ where: { id: pathId } });
    if (!existingPath) throw new Error("Learning path not found");

    if (userRole !== 'ADMIN' && existingPath.createdBy !== userId) {
        throw new Error("Unauthorized to modify this learning path");
    }

    const { title, description, tags, courses, accentColor } = data;

    let updateData = { title, description, accentColor };

    if (tags !== undefined) {
        updateData.tags = tags;
        updateData.learningPathTags = {
            deleteMany: {},
            create: buildTagConnections(tags)
        };
    }

    if (courses !== undefined) {
        updateData.courses = {
            deleteMany: {},
            create: courses.map(c => ({
                courseId: c.courseId,
                order: c.order
            }))
        };
    }

    return prisma.learningPath.update({
        where: { id: pathId },
        data: updateData,
        include: {
            courses: { include: { course: { select: { title: true } } }, orderBy: { order: 'asc' } },
            learningPathTags: { include: { tag: true } }
        }
    });
};

export const deleteLearningPath = async (userId, userRole, pathId) => {
    const existingPath = await prisma.learningPath.findUnique({ where: { id: pathId } });
    if (!existingPath) throw new Error("Learning path not found");

    if (userRole !== 'ADMIN' && existingPath.createdBy !== userId) {
        throw new Error("Unauthorized to delete this learning path");
    }

    // Manually delete relations that don't have cascade
    await prisma.learningPathTag.deleteMany({ where: { pathId } });
    await prisma.learningPathCourse.deleteMany({ where: { pathId } });

    return prisma.learningPath.delete({
        where: { id: pathId }
    });
};
