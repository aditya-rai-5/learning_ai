import prisma from '../config/db.config.js';

export const initiateEnrollment = async (userId, courseId, gateway = "SYSTEM") => {
    // 1. Verify course exists
    const course = await prisma.course.findUnique({
        where: { id: courseId }
    });

    if (!course) {
        throw new Error("Course not found");
    }

    // 2. Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
        where: { userId, courseId }
    });

    if (existingEnrollment) {
        throw new Error("Already enrolled in this course");
    }

    // 3. Check for existing in-progress or successful payments
    const existingPayment = await prisma.payment.findFirst({
        where: { 
            userId, 
            courseId,
            status: { in: ['PENDING', 'SUCCESS'] }
        }
    });

    if (existingPayment) {
        if (existingPayment.status === 'SUCCESS') {
            throw new Error("Payment already completed for this course. Please contact support if you are not enrolled.");
        }
        throw new Error(`A payment is already pending for this course. Please complete it (Payment ID: ${existingPayment.id}).`);
    }

    const price = parseFloat(course.price);

    return prisma.$transaction(async (tx) => {
        // --- FREE COURSE LOGIC ---
        if (price === 0.00) {
            // Create a SUCCESS payment record for 0.00
            const payment = await tx.payment.create({
                data: {
                    userId,
                    courseId,
                    instructorId: course.createdBy,
                    amount: 0.00,
                    currency: course.currency,
                    gateway: "FREE",
                    status: 'SUCCESS'
                }
            });

            // Create active enrollment
            const enrollment = await tx.enrollment.create({
                data: {
                    userId,
                    courseId
                }
            });

            return { status: "ENROLLED", payment, enrollment };
        }

        // --- PAID COURSE LOGIC ---
        // For a paid course, we create a PENDING payment record.
        // We do NOT create the enrollment yet.
        const payment = await tx.payment.create({
            data: {
                userId,
                courseId,
                instructorId: course.createdBy,
                amount: price,
                currency: course.currency,
                gateway,
                status: 'PENDING'
            }
        });

        // Here, in a real app, you would integrate with Stripe/Razorpay to generate a payment intent/session
        // const paymentIntent = await stripe.paymentIntents.create({ amount: price * 100, currency: course.currency });
        
        return { 
            status: "PAYMENT_REQUIRED", 
            paymentId: payment.id,
            amount: price,
            currency: course.currency,
            instructorId: course.createdBy
            // clientSecret: paymentIntent.client_secret
        };
    });
};

export const handlePaymentWebhook = async (paymentId, status, transactionId = null) => {
    // Validate status
    if (!['SUCCESS', 'FAILED'].includes(status)) {
         throw new Error("Invalid payment status update");
    }

    return prisma.$transaction(async (tx) => {
        // 1. Update the Payment record
        const payment = await tx.payment.update({
            where: { id: paymentId },
            data: { 
                status,
                transactionId: transactionId || undefined 
            }
        });

        // 2. If Success, create the Enrollment
        if (status === 'SUCCESS') {
            // Check if enrollment already exists to prevent duplicates on webhook retries
            const existingEnrollment = await tx.enrollment.findFirst({
                where: { userId: payment.userId, courseId: payment.courseId }
            });

            if (!existingEnrollment) {
                 await tx.enrollment.create({
                    data: {
                        userId: payment.userId,
                        courseId: payment.courseId
                    }
                });
            }
        }
        
        // 3. If Failed, we do nothing to enrollment (they don't get access).
        // The frontend can show the user their payment failed and prompt them to try again.

        return payment;
    });
};

export const getInstructorPayments = async (instructorId) => {
    return prisma.payment.findMany({
        where: { 
            instructorId,
            status: 'SUCCESS' // Only show successful payments for earnings
        },
        include: {
            course: { select: { title: true } },
            user: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
};