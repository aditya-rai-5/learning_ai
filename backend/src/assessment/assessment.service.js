import prisma from '../config/db.config.js';

// --- INSTRUCTOR OPERATIONS ---

export const createAssessment = async (userId, userRole, courseId, moduleId, data) => {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new Error("Course not found");

    if (userRole !== 'ADMIN' && course.createdBy !== userId) {
        throw new Error("Unauthorized to modify this course");
    }

    if (moduleId) {
        const module = await prisma.module.findFirst({ where: { id: moduleId, courseId } });
        if (!module) throw new Error("Module not found or does not belong to this course");
    }

    return prisma.$transaction(async (tx) => {
        const newAssessment = await tx.assessment.create({
            data: {
                courseId,
                moduleId: moduleId || null,
                title: data.title,
                passScore: data.passScore,
                maxAttempts: data.maxAttempts,
                timeLimitS: data.timeLimitS,
            }
        });

        // Whenever a new assessment is added, reset course completion status
        await tx.enrollment.updateMany({
            where: { courseId },
            data: { completedAt: null }
        });

        // Notify enrolled students
        const enrollments = await tx.enrollment.findMany({ where: { courseId } });
        if (enrollments.length > 0) {
            const notificationsData = enrollments.map(e => ({
                userId: e.userId,
                type: 'COURSE_UPDATE',
                payloadJson: {
                    message: `A new assessment "${data.title}" has been added to the course "${course.title}".`,
                    courseId,
                    assessmentId: newAssessment.id
                }
            }));
            await tx.notification.createMany({ data: notificationsData });
        }

        return newAssessment;
    });
};

export const addQuestion = async (userId, userRole, assessmentId, data) => {
    const assessment = await prisma.assessment.findUnique({ 
        where: { id: assessmentId },
        include: { course: { select: { createdBy: true } } }
    });

    if (!assessment) throw new Error("Assessment not found");

    if (userRole !== 'ADMIN' && assessment.course.createdBy !== userId) {
        throw new Error("Unauthorized to modify this assessment");
    }

    return prisma.assessmentQuestion.create({
        data: {
            assessmentId,
            type: data.type, // e.g., 'MULTIPLE_CHOICE', 'TRUE_FALSE'
            prompt: data.prompt,
            optionsJson: data.optionsJson, // JSON array of options
            answerKey: data.answerKey,
            points: data.points || 1
        }
    });
};

export const getAssessmentForInstructor = async (userId, userRole, assessmentId) => {
    const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: { 
            questions: true,
            course: { select: { createdBy: true } }
        }
    });

    if (!assessment) throw new Error("Assessment not found");

    if (userRole !== 'ADMIN' && assessment.course.createdBy !== userId) {
        throw new Error("Unauthorized to view this assessment's answers");
    }

    const { course, ...assessmentData } = assessment;
    return assessmentData;
};


// --- STUDENT OPERATIONS ---

export const getAssessmentForStudent = async (assessmentId) => {
    const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: { 
            questions: {
                select: {
                    id: true,
                    type: true,
                    prompt: true,
                    optionsJson: true,
                    points: true
                    // DO NOT include answerKey
                }
            } 
        }
    });

    if (!assessment) throw new Error("Assessment not found");
    return assessment;
};

export const getAssessments = async (courseId, moduleId) => {
    const where = { courseId };
    if (moduleId) where.moduleId = moduleId;
    return prisma.assessment.findMany({
        where,
        include: { _count: { select: { questions: true } } }
    });
};

export const startAttempt = async (userId, assessmentId) => {
    // Verify enrollment
    const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId }
    });
    if (!assessment) throw new Error("Assessment not found");

    const enrollment = await prisma.enrollment.findFirst({
        where: { userId, courseId: assessment.courseId }
    });
    if (!enrollment) throw new Error("Not enrolled in the course");

    // Check previous attempts
    const previousAttemptsCount = await prisma.assessmentAttempt.count({
        where: { userId, assessmentId }
    });

    if (previousAttemptsCount >= assessment.maxAttempts) {
        throw new Error("Maximum attempts reached for this assessment");
    }

    return prisma.assessmentAttempt.create({
        data: {
            userId,
            assessmentId,
            score: 0,
            answersJson: {},
            passed: false,
            startedAt: new Date(),
            submittedAt: new Date() // Initialize, will update on submit
        }
    });
};

export const submitAttempt = async (userId, attemptId, submittedAnswers) => {
    const attempt = await prisma.assessmentAttempt.findUnique({
        where: { id: attemptId, userId },
        include: { assessment: { include: { questions: true } } }
    });

    if (!attempt) throw new Error("Attempt not found");
    
    // In a stricter system, we'd also check if (now - startedAt) > timeLimitS + buffer
    // and reject if too much time has passed.

    const questions = attempt.assessment.questions;
    let totalScore = 0;

    // Evaluate answers
    // submittedAnswers expected format: { "questionId1": "answer1", "questionId2": "answer2" }
    for (const question of questions) {
        const studentAnswer = submittedAnswers[question.id];
        if (studentAnswer && studentAnswer === question.answerKey) {
            totalScore += question.points;
        }
    }

    const passed = totalScore >= attempt.assessment.passScore;

    return prisma.assessmentAttempt.update({
        where: { id: attemptId },
        data: {
            score: totalScore,
            answersJson: submittedAnswers,
            passed: passed,
            submittedAt: new Date()
        }
    });
};

export const getStudentAttempts = async (userId, assessmentId) => {
    return prisma.assessmentAttempt.findMany({
        where: { userId, assessmentId },
        orderBy: { startedAt: 'desc' }
    });
};
