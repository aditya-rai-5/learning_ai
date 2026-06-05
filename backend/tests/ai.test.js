import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.config.js';

// We mock the RAG/AI service calls so we don't actually hit Groq/Mistral APIs during tests
vi.mock('../src/ai/ai.service.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    askQuestion: vi.fn().mockResolvedValue({
      answer: 'This is a mocked AI response based on context.',
      interactionId: 'mock-interaction-id',
      chunksUsed: [{ id: 'chunk1', chunkText: 'mock text', similarity: 0.95 }]
    })
  };
});

describe('AI & RAG Endpoints', () => {
  let userToken;
  let instructorToken;
  let userId;
  let instructorId;
  let courseId;
  let interactionId;

  beforeAll(async () => {
    // 1. Create Instructor
    const instRes = await request(app).post('/api/auth/register').send({
      email: `ai-inst-${Date.now()}@example.com`,
      password: 'password123',
      name: 'AI Instructor',
      role: 'INSTRUCTOR'
    });
    instructorToken = instRes.body.token;
    instructorId = instRes.body.user.id;

    // 2. Create User
    const userRes = await request(app).post('/api/auth/register').send({
      email: `ai-student-${Date.now()}@example.com`,
      password: 'password123',
      name: 'AI Student'
    });
    userToken = userRes.body.token;
    userId = userRes.body.user.id;

    // 3. Create Course
    const courseRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'AI Test Course', description: 'Test for AI features', price: 0 });
    courseId = courseRes.body.course.id;

    // Enroll User
    await request(app)
      .post(`/api/payments/enroll/${courseId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ gateway: 'STRIPE' });
  });

  afterAll(async () => {
    if (courseId) await prisma.course.delete({ where: { id: courseId } }).catch(() => {});
    await prisma.user.deleteMany({
      where: { id: { in: [instructorId, userId] } }
    }).catch(() => {});
    vi.restoreAllMocks();
  });

  describe('AI Configuration', () => {
    it('should set AI config for a course as instructor', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/ai-config`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          temperature: 0.5,
          systemPrompt: 'You are a test bot.'
        });

      expect(res.status).toBe(200);
      expect(res.body.config.systemPrompt).toBe('You are a test bot.');
      expect(res.body.config.temperature).toBe(0.5);
    });

    it('should get the AI config for a course', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}/ai-config`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.systemPrompt).toBe('You are a test bot.');
    });

    it('should prevent student from setting AI config', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/ai-config`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ temperature: 0.9 });

      expect(res.status).toBe(403);
    });
  });

  describe('Chat & RAG Q&A', () => {
    it('should successfully ask a question and get a mocked answer', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/chat`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ question: 'What is this course about?' });

      expect(res.status).toBe(200);
      expect(res.body.answer).toBe('This is a mocked AI response based on context.');
      expect(res.body.chunksUsed.length).toBe(1);
      
      // Seed a real interaction manually in DB for the feedback test to use
      // since our mock doesn't hit the real DB creation logic
      const interaction = await prisma.interaction.create({
        data: {
          userId,
          courseId,
          role: 'assistant',
          message: 'Mock DB answer',
          model: 'test-model'
        }
      });
      interactionId = interaction.id;
    });

    it('should retrieve chat history', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}/chat`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].role).toBe('assistant');
    });
  });

  describe('AI Feedback', () => {
    it('should submit feedback for an AI response', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/chat/interactions/${interactionId}/feedback`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          rating: 4,
          comment: 'Good answer, but could be shorter.'
        });

      expect(res.status).toBe(200);
      expect(res.body.feedback.rating).toBe(4);
    });

    it('should reject invalid ratings', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/chat/interactions/${interactionId}/feedback`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 6 });

      expect(res.status).toBe(400);
    });
  });

  describe('Document Sources', () => {
    let sourceId;

    it('should add a document source', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/document-sources`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          title: 'Course Syllabus',
          sourceUrl: 'https://example.com/syllabus.pdf'
        });

      expect(res.status).toBe(201);
      expect(res.body.source.title).toBe('Course Syllabus');
      sourceId = res.body.source.id;
    });

    it('should get document sources', async () => {
      const res = await request(app)
        .get(`/api/courses/${courseId}/document-sources`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('should delete a document source', async () => {
      const res = await request(app)
        .delete(`/api/courses/${courseId}/document-sources/${sourceId}`)
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
    });
  });
});