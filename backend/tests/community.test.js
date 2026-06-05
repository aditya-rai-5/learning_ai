import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.config.js';

describe('Community Endpoints', () => {
  let userToken;
  let userId;
  let instructorToken;
  let courseId;
  let moduleId;
  let threadId;
  let replyId;
  let reviewId;
  let bookmarkId;

  beforeAll(async () => {
    // 1. Create Instructor
    const instRes = await request(app).post('/api/auth/register').send({
      email: `inst-comm-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Instructor',
      role: 'INSTRUCTOR'
    });
    instructorToken = instRes.body.token;

    // 2. Create User
    const userRes = await request(app).post('/api/auth/register').send({
      email: `user-comm-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Student'
    });
    userToken = userRes.body.token;
    userId = userRes.body.user.id;

    // 3. Create Course & Module
    const courseRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'Comm Course', description: 'Test', price: 0 });
    courseId = courseRes.body.course.id;

    const moduleRes = await request(app)
      .post(`/api/courses/${courseId}/modules`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'Mod 1', contentType: 'TEXT', body: 'body', order: 1, durationS: 10 });
    moduleId = moduleRes.body.module.id;

    // Enroll User
    await request(app)
      .post(`/api/payments/enroll/${courseId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ gateway: 'STRIPE' });
  });

  afterAll(async () => {
    // Cleanup
    if (courseId) await prisma.course.delete({ where: { id: courseId } }).catch(() => {});
    await prisma.user.deleteMany({
      where: { email: { contains: '-comm-' } }
    }).catch(() => {});
  });

  // --- REVIEWS ---
  describe('Course Reviews', () => {
    it('should create a review', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/reviews`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 5, body: 'Great course!' });

      expect(res.status).toBe(201);
      expect(res.body.review.rating).toBe(5);
      reviewId = res.body.review.id;
    });

    it('should get course reviews', async () => {
      const res = await request(app).get(`/api/courses/${courseId}/reviews`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].rating).toBe(5);
    });

    it('should prevent double review', async () => {
      const res = await request(app)
        .post(`/api/courses/${courseId}/reviews`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 4, body: 'Another' });

      expect(res.status).toBe(403);
    });
  });

  // --- BOOKMARKS ---
  describe('Bookmarks', () => {
    it('should create a bookmark', async () => {
      const res = await request(app)
        .post('/api/bookmarks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ moduleId, note: 'Important part' });

      expect(res.status).toBe(201);
      expect(res.body.bookmark.note).toBe('Important part');
      bookmarkId = res.body.bookmark.id;
    });

    it('should get bookmarks', async () => {
      const res = await request(app)
        .get('/api/bookmarks')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('should update a bookmark', async () => {
      const res = await request(app)
        .put(`/api/bookmarks/${bookmarkId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ note: 'Updated note' });

      expect(res.status).toBe(200);
      expect(res.body.bookmark.note).toBe('Updated note');
    });
  });

  // --- DISCUSSIONS ---
  describe('Discussions', () => {
    it('should create a thread', async () => {
      const res = await request(app)
        .post('/api/threads')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ moduleId, title: 'Help', body: 'I am stuck' });

      expect(res.status).toBe(201);
      expect(res.body.thread.title).toBe('Help');
      threadId = res.body.thread.id;
    });

    it('should get threads by module', async () => {
      const res = await request(app).get(`/api/threads?moduleId=${moduleId}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('should create a reply', async () => {
      const res = await request(app)
        .post(`/api/threads/${threadId}/replies`)
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ body: 'Here is the answer' });

      expect(res.status).toBe(201);
      expect(res.body.reply.body).toBe('Here is the answer');
      replyId = res.body.reply.id;
    });

    it('should create a nested child reply', async () => {
      const res = await request(app)
        .post(`/api/threads/${threadId}/replies`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ body: 'Thank you Professor!', parentReplyId: replyId });

      expect(res.status).toBe(201);
      expect(res.body.reply.parentReplyId).toBe(replyId);
    });

    it('should upvote a reply', async () => {
      const res = await request(app)
        .post(`/api/replies/${replyId}/upvote`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.reply._count.upvotes).toBe(1);
    });

    it('should mark as answer', async () => {
      const res = await request(app)
        .patch(`/api/replies/${replyId}/answer`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.reply.isAnswer).toBe(true);
    });
  });
});
