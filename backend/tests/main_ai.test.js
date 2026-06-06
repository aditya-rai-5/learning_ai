import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.config.js';

// Note: No vi.mock() here. This test will hit the real Groq and Mistral APIs.
// Ensure GROQ_API_KEY and MISTRAL_API_KEY are set in your .env file or environment.

describe('Real AI & RAG Endpoints (Integration)', () => {
  let userToken;
  let instructorToken;
  let userId;
  let instructorId;
  let courseId;
  let moduleId;
  let interactionId;

  beforeAll(async () => {
    // 1. Create Instructor
    const instRes = await request(app).post('/api/auth/register').send({
      email: `real-ai-inst-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Real AI Instructor',
      role: 'INSTRUCTOR'
    });
    instructorToken = instRes.body.token;
    instructorId = instRes.body.user.id;

    // 2. Create User
    const userRes = await request(app).post('/api/auth/register').send({
      email: `real-ai-student-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Real AI Student'
    });
    userToken = userRes.body.token;
    userId = userRes.body.user.id;

    // 3. Create Course
    const courseRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'Real AI Test Course', description: 'Testing actual LLM', price: 0 });
    courseId = courseRes.body.course.id;

    // Enroll User
    await request(app)
      .post(`/api/payments/enroll/${courseId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ gateway: 'STRIPE' });

    // 4. Create a Module to Ingest
    const moduleRes = await request(app)
      .post(`/api/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ 
        title: 'Introduction to Real AI', 
        contentType: 'TEXT', 
        body: 'The sky is blue because of Rayleigh scattering. Water is essential for life.', 
        order: 1, 
        durationS: 200 
      });
    moduleId = moduleRes.body.module.id;
  });

  afterAll(async () => {
    // Cleanup
    if (courseId) await prisma.course.delete({ where: { id: courseId } }).catch(() => {});
    await prisma.user.deleteMany({
      where: { id: { in: [instructorId, userId] } }
    }).catch(() => {});
  });

  it('should ingest a module (Hits real Mistral API)', async () => {
    // Skip test if no API key is set or using a dummy key
    if (!process.env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY === 'test-dummy-key') {
      console.warn('Skipping ingest test because real MISTRAL_API_KEY is not set');
      return;
    }

    const res = await request(app)
      .post(`/api/courses/${courseId}/ingest`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ moduleId });

    expect(res.status).toBe(200);
    expect(res.body.chunksCreated).toBeGreaterThan(0);
  }, 10000); // 10s timeout for external API call

  it('should answer a question based on context (Hits real Groq API)', async () => {
    // Skip test if no API key is set
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'test-dummy-key') {
      console.warn('Skipping chat test because real GROQ_API_KEY is not set');
      return;
    }

    const res = await request(app)
      .post(`/api/courses/${courseId}/chat`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ question: 'Why is the sky blue?', moduleId });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('answer');
    expect(res.body).toHaveProperty('interactionId');
    expect(typeof res.body.answer).toBe('string');
    // It should have retrieved context chunks since we ingested the module
    expect(res.body.chunksUsed.length).toBeGreaterThan(0);

    interactionId = res.body.interactionId;
  }, 25000); // 15s timeout for Groq API call

  it('should retrieve real chat history from the database', async () => {
    if (!interactionId) return; // skipped if chat was skipped

    const res = await request(app)
      .get(`/api/courses/${courseId}/chat`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    // At least 2 messages: the user question and the assistant response
    expect(res.body.length).toBeGreaterThanOrEqual(2); 
    
    // Verify the latest response is the assistant's real response
    const assistantReply = res.body.find(msg => msg.id === interactionId);
    expect(assistantReply).toBeDefined();
    expect(assistantReply.role).toBe('assistant');
    expect(assistantReply.message.length).toBeGreaterThan(0);
    expect(assistantReply.message).not.toBe('Mock DB answer'); // Ensures it's real
  });
});
