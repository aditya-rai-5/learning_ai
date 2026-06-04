import prisma from '../config/db.config.js';

export const createReview = async (userId, courseId, rating, body) => {
    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
        where: { userId, courseId }
    });

    if (!enrollment) {
        throw new Error("You must be enrolled in the course to leave a review");
    }

    // Check if review already exists
    const existingReview = await prisma.courseReview.findFirst({
        where: { userId, courseId }
    });

    if (existingReview) {
        throw new Error("You have already reviewed this course");
    }

    return prisma.courseReview.create({
        data: {
            userId,
            courseId,
            rating,
            body
        }
    });
};

export const getCourseReviews = async (courseId) => {
    return prisma.courseReview.findMany({
        where: { courseId },
        include: {
            user: {
                select: { id: true, name: true, avatarUrl: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const updateReview = async (userId, reviewId, updateData) => {
    const review = await prisma.courseReview.findUnique({ where: { id: reviewId } });

    if (!review) throw new Error("Review not found");
    if (review.userId !== userId) throw new Error("Unauthorized");

    const { rating, body } = updateData;

    return prisma.courseReview.update({
        where: { id: reviewId },
        data: {
            rating: rating !== undefined ? rating : review.rating,
            body: body !== undefined ? body : review.body,
        }
    });
};

export const deleteReview = async (userId, reviewId) => {
    const review = await prisma.courseReview.findUnique({ where: { id: reviewId } });

    if (!review) throw new Error("Review not found");
    // Admins could also delete, but for now just the owner
    if (review.userId !== userId) throw new Error("Unauthorized");

    return prisma.courseReview.delete({
        where: { id: reviewId }
    });
};
