import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.config.js';

describe('Assessments & Progress', () => {
  let instructorToken, studentToken;
  let courseId, moduleId, assessmentId, questionId, attemptId;
  let instructorId, studentId;

  beforeAll(async () => {
    const instRes = await request(app).post('/api/auth/register').send({
      email: `eval-inst-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Instructor',
      role: 'INSTRUCTOR'
    });
    instructorToken = instRes.body.token; instructorId = instRes.body.user.id;

    const studRes = await request(app).post('/api/auth/register').send({
      email: `eval-stud-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Student'
    });
    studentToken = studRes.body.token; studentId = studRes.body.user.id;

    const courseRes = await request(app).post('/api/courses').set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'Eval Course', description: 'desc', price: 0 });
    courseId = courseRes.body.course.id;

    const modRes = await request(app).post(`/api/courses/${courseId}/modules`).set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'Module 1', contentType: 'TEXT', body: 'body', order: 1, durationS: 100 });
    moduleId = modRes.body.module.id;

    await request(app).post(`/api/payments/enroll/${courseId}`).set('Authorization', `Bearer ${studentToken}`).send({ gateway: 'STRIPE' });
  });

  afterAll(async () => {
    if (courseId) await prisma.course.delete({ where: { id: courseId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [instructorId, studentId] } } }).catch(() => {});
  });

  // --- PROGRESS ---
  describe('Module Progress', () => {
    it('should update progress for a module', async () => {
      const res = await request(app)
        .post(`/api/enrollments/${courseId}/progress/${moduleId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'COMPLETED', timeSpentS: 60, lastPosition: '100' });

      expect(res.status).toBe(200);
      expect(res.body.progress.status).toBe('COMPLETED');
    });

    it('should retrieve updated progress', async () => {
      const res = await request(app).get(`/api/enrollments/${courseId}`).set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.progress.length).toBeGreaterThan(0);
      expect(res.body.progress[0].status).toBe('COMPLETED');
    });
  });

  // --- ASSESSMENTS ---
  describe('Assessments', () => {
    it('should create an assessment', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/modules/${moduleId}/assessments`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ title: 'Quiz 1', passScore: 10, maxAttempts: 3, timeLimitS: 600 });
      
      expect(res.status).toBe(201);
      assessmentId = res.body.id; // Controller might return full object or specific keys, testing generic
      if (!assessmentId && res.body.assessment) assessmentId = res.body.assessment.id;
    });

    it('should add a question to assessment', async () => {
      const res = await request(app)
        .post(`/api/assessments/${assessmentId}/questions`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ type: 'MULTIPLE_CHOICE', prompt: '2+2?', optionsJson: ['3', '4'], answerKey: '4', points: 10 });
      
      expect(res.status).toBe(201);
      questionId = res.body.id || res.body.question?.id;
    });

    it('instructor should see answer key', async () => {
      const res = await request(app).get(`/api/assessments/${assessmentId}/instructor`).set('Authorization', `Bearer ${instructorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.questions[0].answerKey).toBe('4');
    });

    it('student should NOT see answer key', async () => {
      const res = await request(app).get(`/api/assessments/${assessmentId}`).set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.questions[0].answerKey).toBeUndefined(); // Assuming controller strips it
    });

    it('should start an attempt', async () => {
      const res = await request(app).post(`/api/assessments/${assessmentId}/attempts`).set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(201);
      attemptId = res.body.id || res.body.attempt?.id;
    });

    it('should submit an attempt and score it', async () => {
      const res = await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: { [questionId]: '4' } }); // Correct answer
      
      expect(res.status).toBe(200);
      expect(res.body.score).toBe(10);
      expect(res.body.passed).toBe(true);
    });
  });

  // --- CERTIFICATES ---
  describe('Certificates', () => {
    let certHash;

    it('should issue a certificate for completed course', async () => {
      // Mark course as completed first
      await request(app).post(`/api/enrollments/${courseId}/complete`).set('Authorization', `Bearer ${studentToken}`);

      const res = await request(app)
        .post(`/api/courses/${courseId}/certificates`)
        .set('Authorization', `Bearer ${studentToken}`);
      
      expect(res.status).toBe(201);
      certHash = res.body.certificate.hash;
    });

    it('should get my certificates', async () => {
      const res = await request(app).get('/api/my-certificates').set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should verify a certificate publicly', async () => {
      const res = await request(app).get(`/api/certificates/verify/${certHash}`);
      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.certificate.course.title).toBe('Eval Course');
    });
  });
});
