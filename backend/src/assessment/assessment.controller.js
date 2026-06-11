import * as assessmentService from './assessment.service.js';

// --- INSTRUCTOR ENDPOINTS ---

export const createAssessment = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { courseId, moduleId } = req.params;
        const data = req.body;
        
        // Basic validation could go here
        
        const assessment = await assessmentService.createAssessment(userId, userRole, courseId, moduleId, data);
        res.status(201).json(assessment);
    } catch (error) {
        if (error.message.includes("not found")) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes("Unauthorized")) {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const addQuestion = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { assessmentId } = req.params;
        const data = req.body;
        
        const question = await assessmentService.addQuestion(userId, userRole, assessmentId, data);
        res.status(201).json(question);
    } catch (error) {
        if (error.message.includes("not found")) {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes("Unauthorized")) {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const getAssessmentForInstructor = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userRole = req.user.role;
        const { assessmentId } = req.params;
        const assessment = await assessmentService.getAssessmentForInstructor(userId, userRole, assessmentId);
        res.status(200).json(assessment);
    } catch (error) {
        if (error.message === "Assessment not found") {
            return res.status(404).json({ error: error.message });
        }
        if (error.message.includes("Unauthorized")) {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

// --- STUDENT ENDPOINTS ---

export const getAssessmentForStudent = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const assessment = await assessmentService.getAssessmentForStudent(assessmentId);
        res.status(200).json(assessment);
    } catch (error) {
        if (error.message === "Assessment not found") {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const getAssessments = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { moduleId } = req.query;
        const assessments = await assessmentService.getAssessments(courseId, moduleId);
        res.status(200).json(assessments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const startAttempt = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { assessmentId } = req.params;
        
        const attempt = await assessmentService.startAttempt(userId, assessmentId);
        res.status(201).json(attempt);
    } catch (error) {
        if (error.message.includes("Not enrolled") || error.message.includes("not found")) {
            return res.status(403).json({ error: error.message });
        }
        if (error.message.includes("Maximum attempts")) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const submitAttempt = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { attemptId } = req.params;
        const { answers } = req.body; // e.g., { "questionId": "answer" }
        
        const result = await assessmentService.submitAttempt(userId, attemptId, answers);
        res.status(200).json(result);
    } catch (error) {
        if (error.message === "Attempt not found") {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

export const getStudentAttempts = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { assessmentId } = req.params;
        
        const attempts = await assessmentService.getStudentAttempts(userId, assessmentId);
        res.status(200).json(attempts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
