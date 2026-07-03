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

export const getInstructorLearningPaths = async (instructorId) => {
    return prisma.learningPath.findMany({
        where: { createdBy: instructorId },
        include: {
            courses: { include: { course: { select: { title: true } } }, orderBy: { order: 'asc' } },
            _count: { select: { enrollments: true } }
        },
        orderBy: { title: 'asc' }
    });
};

export const getInstructorAnalytics = async (instructorId) => {
    // 1. Get all courses for this instructor
    const courses = await prisma.course.findMany({
        where: { createdBy: instructorId },
        select: { id: true, title: true, _count: { select: { modules: true } } }
    });

    const courseIds = courses.map(c => c.id);

    if (courseIds.length === 0) {
        return {
            totalStudyTimeS: 0,
            completionRate: 0,
            courseStats: [],
            dailyTrends: []
        };
    }

    // 2. Aggregate StudySessions
    const sessionAgg = await prisma.studySession.aggregate({
        where: { courseId: { in: courseIds } },
        _sum: { durationS: true },
        _count: { id: true }
    });

    const totalStudyTimeS = sessionAgg._sum.durationS || 0;

    // 3. Completion Rate
    // Fetch all enrollments for these courses
    const enrollments = await prisma.enrollment.findMany({
        where: { courseId: { in: courseIds } },
        include: {
            progress: { where: { status: 'COMPLETED' } }
        }
    });

    let totalExpectedCompletions = 0;
    let totalActualCompletions = 0;

    const courseStats = courses.map(course => {
        const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
        const expectedCompletions = courseEnrollments.length * course._count.modules;
        
        let actualCompletions = 0;
        let completedEnrollments = 0;
        courseEnrollments.forEach(e => {
            actualCompletions += e.progress.length;
            if (e.completedAt) completedEnrollments++;
        });

        totalExpectedCompletions += expectedCompletions;
        totalActualCompletions += actualCompletions;

        const rate = expectedCompletions > 0 ? Math.round((actualCompletions / expectedCompletions) * 100) : 0;

        return {
            id: course.id,
            title: course.title,
            enrollments: courseEnrollments.length,
            completedEnrollments,
            completionRate: rate
        };
    });

    const overallCompletionRate = totalExpectedCompletions > 0 
        ? Math.round((totalActualCompletions / totalExpectedCompletions) * 100) 
        : 0;

    // 4. Daily Trends (last 7 days of study sessions)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSessions = await prisma.studySession.findMany({
        where: {
            courseId: { in: courseIds },
            startedAt: { gte: sevenDaysAgo }
        },
        select: { startedAt: true, durationS: true }
    });

    const dailyMap = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        dailyMap[dateStr] = 0;
    }

    recentSessions.forEach(session => {
        const dateStr = session.startedAt.toISOString().split('T')[0];
        if (dailyMap[dateStr] !== undefined) {
            dailyMap[dateStr] += session.durationS;
        }
    });

    const dailyTrends = Object.keys(dailyMap).map(date => ({
        date,
        durationS: dailyMap[date]
    })).sort((a, b) => a.date.localeCompare(b.date));

    return {
        totalStudyTimeS,
        overallCompletionRate,
        courseStats,
        dailyTrends
    };
};

export const getInstructorEarnings = async (instructorId) => {
    // Total Payments (Gross)
    const paymentsResult = await prisma.payment.aggregate({
        where: { instructorId, status: 'SUCCESS' },
        _sum: { amount: true }
    });
    const grossEarnings = paymentsResult._sum.amount ? parseFloat(paymentsResult._sum.amount) : 0;
    const totalEarnings = grossEarnings * 0.8; // 80% instructor cut

    // Total Payouts
    const payoutsResult = await prisma.payoutRequest.aggregate({
        where: { instructorId, status: { in: ['PENDING', 'PROCESSED'] } },
        _sum: { amount: true }
    });
    const totalPayouts = payoutsResult._sum.amount ? parseFloat(payoutsResult._sum.amount) : 0;

    const availableBalance = totalEarnings - totalPayouts;

    const recentTransactions = await prisma.payment.findMany({
        where: { instructorId, status: 'SUCCESS' },
        include: { course: { select: { title: true } }, user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    // Map transactions to show the 80% cut
    const adjustedTransactions = recentTransactions.map(tx => ({
        ...tx,
        amount: (parseFloat(tx.amount) * 0.8).toFixed(2)
    }));

    // Fetch payout history
    const payoutHistory = await prisma.payoutRequest.findMany({
        where: { instructorId },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    return {
        totalEarnings,
        availableBalance,
        recentTransactions: adjustedTransactions,
        payoutHistory
    };
};

export const requestPayout = async (instructorId, amount) => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Invalid payout amount");
    }

    const { availableBalance } = await getInstructorEarnings(instructorId);

    if (parsedAmount > availableBalance) {
        throw new Error("Insufficient available balance");
    }

    return prisma.payoutRequest.create({
        data: {
            instructorId,
            amount: parsedAmount,
            status: "PENDING"
        }
    });
};
