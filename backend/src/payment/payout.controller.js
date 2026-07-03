import prisma from '../config/db.config.js';

export const requestPayout = async (req, res) => {
    try {
        const instructorId = req.user.id;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }

        // Calculate total earnings
        const payments = await prisma.payment.findMany({
            where: { instructorId, status: 'SUCCESS' }
        });

        const grossEarnings = payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
        const netEarnings = grossEarnings * 0.8; // 80% instructor cut

        // Calculate already requested/paid amounts
        const payouts = await prisma.payoutRequest.findMany({
            where: { instructorId }
        });

        const totalRequested = payouts.reduce((acc, p) => {
            if (p.status !== 'REJECTED') return acc + parseFloat(p.amount);
            return acc;
        }, 0);

        const availableBalance = netEarnings - totalRequested;

        if (parseFloat(amount) > availableBalance) {
            return res.status(400).json({ error: "Requested amount exceeds available balance" });
        }

        const payout = await prisma.payoutRequest.create({
            data: {
                instructorId,
                amount: parseFloat(amount),
                status: 'PENDING'
            }
        });

        res.status(201).json({ payout });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getInstructorPayouts = async (req, res) => {
    try {
        const payouts = await prisma.payoutRequest.findMany({
            where: { instructorId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        
        // Also send back earnings context
        const payments = await prisma.payment.findMany({
            where: { instructorId: req.user.id, status: 'SUCCESS' }
        });
        const grossEarnings = payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);
        const netEarnings = grossEarnings * 0.8;
        
        const totalRequested = payouts.reduce((acc, p) => {
            if (p.status !== 'REJECTED') return acc + parseFloat(p.amount);
            return acc;
        }, 0);

        res.status(200).json({ 
            payouts, 
            grossEarnings, 
            netEarnings, 
            availableBalance: netEarnings - totalRequested 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAdminPayouts = async (req, res) => {
    try {
        const payouts = await prisma.payoutRequest.findMany({
            include: {
                instructor: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(payouts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const approvePayout = async (req, res) => {
    try {
        const { id } = req.params;
        const payout = await prisma.payoutRequest.update({
            where: { id },
            data: {
                status: 'PROCESSED',
                processedAt: new Date()
            }
        });
        res.status(200).json({ payout });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
