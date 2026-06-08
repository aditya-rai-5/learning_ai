import prisma from '../config/db.config.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

export const initiateEnrollment = async (userId, courseId, gateway = "RAZORPAY") => {
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

        // --- PAID COURSE LOGIC (RAZORPAY) ---
        
        // 1. Create order on Razorpay
        const amountInPaise = Math.round(price * 100); // Razorpay expects amount in smallest currency unit (paise/cents)
        
        // Ensure currency is INR for UPI testing, Razorpay supports others but INR is standard for UPI
        const orderCurrency = course.currency === 'USD' ? 'INR' : course.currency; 
        // Note: For a real project you'd probably want to make sure the course price is stored as INR if targeting India.
        
        const options = {
            amount: amountInPaise,
            currency: orderCurrency,
            receipt: `rcpt_${userId}_${courseId}`.substring(0, 40)
        };

        // Note: You can't await Razorpay inside a Prisma transaction easily if the transaction locks, 
        // but it's an external API call. Ideally it should be outside the transaction, but we will do it here.
        const order = await razorpay.orders.create(options);

        // 2. Save the pending payment with the Razorpay order ID as transactionId
        const payment = await tx.payment.create({
            data: {
                userId,
                courseId,
                instructorId: course.createdBy,
                amount: price,
                currency: orderCurrency,
                gateway,
                transactionId: order.id, // Store Razorpay Order ID here temporarily
                status: 'PENDING'
            }
        });
        
        return { 
            status: "PAYMENT_REQUIRED", 
            paymentId: payment.id,
            razorpayOrderId: order.id,
            amount: amountInPaise,
            currency: orderCurrency,
            instructorId: course.createdBy
        };
    });
};

export const verifyRazorpayPayment = async (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_secret';

    const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest('hex');

    if (generated_signature !== razorpay_signature) {
        throw new Error("Payment signature verification failed");
    }

    return prisma.$transaction(async (tx) => {
        // Find the pending payment by order id
        const payment = await tx.payment.findUnique({
            where: { transactionId: razorpay_order_id }
        });

        if (!payment) throw new Error("Payment record not found");
        if (payment.status === 'SUCCESS') return payment; // Already processed

        // 1. Update Payment record to SUCCESS, replace orderId with actual paymentId
        const updatedPayment = await tx.payment.update({
            where: { id: payment.id },
            data: { 
                status: 'SUCCESS',
                transactionId: razorpay_payment_id 
            }
        });

        // 2. Create the Enrollment
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

        return updatedPayment;
    });
};

export const handlePaymentWebhook = async (paymentId, status, transactionId = null) => {
    // Keep this around for other generic webhooks if needed
    if (!['SUCCESS', 'FAILED'].includes(status)) {
         throw new Error("Invalid payment status update");
    }

    return prisma.$transaction(async (tx) => {
        const payment = await tx.payment.update({
            where: { id: paymentId },
            data: { 
                status,
                transactionId: transactionId || undefined 
            }
        });

        if (status === 'SUCCESS') {
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