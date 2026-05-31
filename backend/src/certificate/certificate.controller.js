import * as certificateService from './certificate.service.js';

export const issueCertificate = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { courseId } = req.params;

        const certificate = await certificateService.issueCertificate(userId, courseId);
        res.status(201).json({ message: "Certificate issued successfully", certificate });
    } catch (error) {
        if (error.message.includes("not enrolled") || error.message.includes("must be marked as completed")) {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const getCertificate = async (req, res) => {
    try {
        const { certificateId } = req.params;
        const certificate = await certificateService.getCertificateById(certificateId);
        res.status(200).json(certificate);
    } catch (error) {
        if (error.message === "Certificate not found") {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const getMyCertificates = async (req, res) => {
    try {
        const userId = req.user.userId;
        const certificates = await certificateService.getUserCertificates(userId);
        res.status(200).json(certificates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const verifyCertificate = async (req, res) => {
    try {
        const { hash } = req.params;
        const certificate = await certificateService.verifyCertificate(hash);
        res.status(200).json({ valid: true, certificate });
    } catch (error) {
        if (error.message === "Invalid certificate hash") {
            return res.status(404).json({ valid: false, error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};
