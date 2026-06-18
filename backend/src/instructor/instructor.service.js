import prisma from '../config/db.config.js';

export const getInstructorOverview = async (instructorId) => {
    // 1. Total courses published
    const totalCourses = await prisma.course.count({
        where: { createdBy: instructorId }
    });

    // 2. Total active students (unique enrollments across all their courses)
    // First, find all course IDs for this instructor
    const courses = await prisma.course.findMany({
        where: { createdBy: instructorId },
        select: { id: true }
    });
    
    const courseIds = courses.map(c => c.id);
    
    let totalStudents = 0;
    if (courseIds.length > 0) {
        // Group by user id to get distinct count. Prisma doesn't have distinct count directly.
        const distinctEnrollments = await prisma.enrollment.groupBy({
            by: ['userId'],
            where: { courseId: { in: courseIds } }
        });
        totalStudents = distinctEnrollments.length;
    }

    // 3. Estimated revenue
    const revenueResult = await prisma.payment.aggregate({
        _sum: {
            amount: true
        },
        where: {
            instructorId: instructorId,
            status: 'SUCCESS'
        }
    });

    const revenue = revenueResult._sum.amount ? parseFloat(revenueResult._sum.amount) : 0;

    return {
        totalCourses,
        totalStudents,
        revenue
    };
};

export const getInstructorCourses = async (instructorId) => {
    return prisma.course.findMany({
        where: { createdBy: instructorId },
        include: {
            _count: {
                select: { enrollments: true, modules: true }
            },
            tags: {
                include: { tag: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const getInstructorQA = async (instructorId) => {
    return prisma.discussionThread.findMany({
        where: {
            course: {
                createdBy: instructorId
            }
        },
        include: {
            course: { select: { title: true, slug: true } },
            module: { select: { title: true } },
            author: { select: { name: true, avatarUrl: true } },
            _count: {
                select: { replies: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const getPublicInstructorProfile = async (instructorId) => {
    const instructor = await prisma.user.findUnique({
        where: { id: instructorId },
        select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            createdAt: true,
            skills: true
        }
    });

    if (!instructor) {
        throw new Error("Instructor not found");
    }

    const courses = await prisma.course.findMany({
        where: { createdBy: instructorId },
        include: {
            creator: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { enrollments: true, modules: true } },
            tags: { include: { tag: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    return {
        ...instructor,
        courses
    };
};
