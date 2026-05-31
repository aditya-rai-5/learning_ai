import prisma from '../config/db.config.js';
import crypto from 'crypto';

export const issueCertificate = async (userId, courseId) => {
    // 1. Check if enrollment exists and is completed
    const enrollment = await prisma.enrollment.findFirst({
        where: { userId, courseId }
    });

    if (!enrollment) {
        throw new Error("You are not enrolled in this course");
    }

    if (!enrollment.completedAt) {
        throw new Error("Course must be marked as completed before a certificate can be issued");
    }

    // 2. Check if a certificate already exists
    const existingCertificate = await prisma.certificate.findFirst({
        where: { userId, courseId }
    });

    if (existingCertificate) {
        return existingCertificate;
    }

    // 3. Generate a hash for verification
    const hash = crypto.randomBytes(32).toString('hex');
    
    // Simulate a generated certificate URL (In a real app, this would be a PDF stored in S3/Cloudinary)
    const certUrl = `https://example.com/certificates/${hash}.pdf`;

    return prisma.certificate.create({
        data: {
            userId,
            courseId,
            hash,
            certUrl
        }
    });
};

export const getCertificateById = async (certificateId) => {
    const certificate = await prisma.certificate.findUnique({
        where: { id: certificateId },
        include: {
            user: { select: { id: true, name: true, email: true } },
            course: { select: { id: true, title: true, slug: true } }
        }
    });

    if (!certificate) {
        throw new Error("Certificate not found");
    }

    return certificate;
};

export const getUserCertificates = async (userId) => {
    return prisma.certificate.findMany({
        where: { userId },
        include: {
            course: { select: { id: true, title: true, slug: true, thumbnailUrl: true } }
        },
        orderBy: { issuedAt: 'desc' }
    });
};

export const verifyCertificate = async (hash) => {
    const certificate = await prisma.certificate.findFirst({
        where: { hash },
        include: {
            user: { select: { name: true } },
            course: { select: { title: true } }
        }
    });

    if (!certificate) {
        throw new Error("Invalid certificate hash");
    }

    return certificate;
};
