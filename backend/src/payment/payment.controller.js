import * as paymentService from './payment.service.js';

export const enrollOrPurchase = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { courseId } = req.params;
        const { gateway } = req.body;

        const result = await paymentService.initiateEnrollment(userId, courseId, gateway);
        
        if (result.status === "ENROLLED") {
             res.status(200).json({ message: "Successfully enrolled in free course", enrollment: result.enrollment });
        } else {
             res.status(200).json({ 
                 message: "Payment required", 
                 paymentDetails: result 
            });
        }
    } catch (error) {
        if (error.message.includes("Already enrolled") || error.message.includes("payment is already pending") || error.message.includes("Payment already completed")) {
             return res.status(400).json({ error: error.message });
        }
        if (error.message.includes("not found")) {
             return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

// This endpoint simulates a webhook from a payment gateway (like Stripe)
export const simulatePaymentWebhook = async (req, res) => {
    try {
        // In a real app, you MUST verify the webhook signature here!
        const { paymentId, status, transactionId } = req.body;

        if (!paymentId || !status) {
            return res.status(400).json({ error: "paymentId and status are required" });
        }

        const payment = await paymentService.handlePaymentWebhook(paymentId, status, transactionId);
        
        res.status(200).json({ message: `Payment marked as ${status}`, payment });
    } catch (error) {
         res.status(500).json({ error: error.message });
    }
};

export const getInstructorEarnings = async (req, res) => {
    try {
        if (req.user.role !== 'INSTRUCTOR' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: "Access denied" });
        }

        const payments = await paymentService.getInstructorPayments(req.user.userId);
        
        // Calculate total earnings
        const totalEarnings = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

        res.status(200).json({
            totalEarnings,
            transactions: payments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};