import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.config.js';
import { createNotification } from '../src/notification/notification.service.js';

describe('Notifications & Study Sessions', () => {
  let userToken;
  let userId;
  let courseId;
  let notificationId;
  let sessionId;

  beforeAll(async () => {
    // 1. Create User
    const userRes = await request(app).post('/api/auth/register').send({
      email: `non-ai-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Non AI User',
      role: 'INSTRUCTOR' // Need instructor to easily create course
    });
    userToken = userRes.body.token;
    userId = userRes.body.user.id;

    // 2. Create Course
    const courseRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Non AI Course', description: 'Test', price: 0 });
    courseId = courseRes.body.course.id;
  });

  afterAll(async () => {
    // Cleanup
    if (courseId) await prisma.course.delete({ where: { id: courseId } }).catch(() => {});
    await prisma.user.deleteMany({
      where: { email: { contains: 'non-ai' } }
    }).catch(() => {});
  });

  // --- NOTIFICATIONS ---
  describe('Notifications', () => {
    it('should retrieve notifications', async () => {
      // Manually create a notification since there's no endpoint to create them (they are system generated)
      const notif = await createNotification(userId, 'SYSTEM', { message: 'Welcome' });
      notificationId = notif.id;

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].readAt).toBeNull();
    });

    it('should mark a notification as read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.notification.readAt).not.toBeNull();
    });

    it('should mark all notifications as read', async () => {
      // Create another unread
      await createNotification(userId, 'SYSTEM', { message: 'Test 2' });
      
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);

      // Verify
      const unreadRes = await request(app)
        .get('/api/notifications?unread=true')
        .set('Authorization', `Bearer ${userToken}`);
      expect(unreadRes.body.length).toBe(0);
    });

    it('should delete a notification', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
    });
  });

  // --- STUDY SESSIONS ---
  describe('Study Sessions', () => {
    let moduleId;
    
    beforeAll(async () => {
      const moduleRes = await request(app)
        .post(`/api/courses/${courseId}/modules`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'Study Mod', contentType: 'TEXT', body: 'body', order: 1, durationS: 10 });
      moduleId = moduleRes.body.module.id;
    });

    it('should start a study session', async () => {
      const res = await request(app)
        .post('/api/study-sessions/start')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ courseId, moduleId });

      expect(res.status).toBe(201);
      expect(res.body.session.courseId).toBe(courseId);
      expect(res.body.session.moduleId).toBe(moduleId);
      sessionId = res.body.session.id;
    });

    it('should retrieve study sessions', async () => {
      const res = await request(app)
        .get(`/api/study-sessions?courseId=${courseId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it('should end a study session', async () => {
      // Wait a tiny bit to simulate some duration
      await new Promise(resolve => setTimeout(resolve, 100));

      const res = await request(app)
        .patch(`/api/study-sessions/${sessionId}/end`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.session.durationS).toBeGreaterThanOrEqual(0);
    });
  });
});
