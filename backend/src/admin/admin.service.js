import prisma from '../config/db.config.js';

export const getSystemStats = async () => {
    const totalUsers = await prisma.user.count();
    const totalCourses = await prisma.course.count();
    const totalEnrollments = await prisma.enrollment.count();
    
    const revenueResult = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS' }
    });
    const totalRevenue = revenueResult._sum.amount ? parseFloat(revenueResult._sum.amount) : 0;

    return { totalUsers, totalCourses, totalEnrollments, totalRevenue };
};

export const getAllUsers = async (page = 1, limit = 50) => {
    const skip = (page - 1) * limit;
    const users = await prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            _count: { select: { enrollments: true, coursesCreated: true } }
        }
    });
    
    const total = await prisma.user.count();
    
    return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
};

export const deleteUser = async (userId) => {
    // Note: Prisma schema uses onDelete: Cascade for many relations, 
    // but might fail if some relations aren't cascaded. Assuming Cascade is set.
    return prisma.user.delete({
        where: { id: userId }
    });
};

export const getAllCourses = async () => {
    return prisma.course.findMany({
        include: {
            creator: { select: { id: true, name: true, email: true } },
            _count: { select: { enrollments: true, modules: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const sendNotification = async (senderId, targetUserId, message, type = 'SYSTEM_ALERT') => {
    return prisma.notification.create({
        data: {
            userId: targetUserId,
            type,
            payloadJson: { message, senderId }
        }
    });
};

export const getAllThreads = async () => {
    return prisma.discussionThread.findMany({
        include: {
            author: { select: { id: true, name: true } },
            course: { select: { id: true, title: true } },
            _count: { select: { replies: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
};
