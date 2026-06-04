import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.config.js';

describe('Enrollment Endpoints', () => {
  let studentToken;
  let studentId;
  let instructorToken;
  let instructorId;
  let courseId;

  beforeAll(async () => {
    // Register instructor and create a course
    const instructorRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `inst-enroll-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Inst Enroll',
        role: 'INSTRUCTOR',
      });
    instructorToken = instructorRes.body.token;
    instructorId = instructorRes.body.user.id;

    const courseRes = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Enrollment Test Course',
        description: 'Test Description',
        price: 0, // Free course for easy enrollment
      });
    courseId = courseRes.body.course.id;

    // Register student
    const studentRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `stud-enroll-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Stud Enroll',
      });
    studentToken = studentRes.body.token;
    studentId = studentRes.body.user.id;
  });

  afterAll(async () => {
    // Cleanup
    if (courseId) {
      await prisma.course.delete({ where: { id: courseId } }).catch(() => {});
    }
    await prisma.user.deleteMany({
      where: { id: { in: [studentId, instructorId] } }
    }).catch(() => {});
  });

  it('should enroll in a free course', async () => {
    const res = await request(app)
      .post(`/api/payments/enroll/${courseId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ gateway: 'STRIPE' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Successfully enrolled');
  });

  it('should get my enrollments', async () => {
    const res = await request(app)
      .get('/api/enrollments')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(e => e.courseId === courseId)).toBe(true);
  });
});
