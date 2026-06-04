import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.config.js';

describe('Course Endpoints', () => {
  let instructorToken;
  let instructorId;
  let courseId;

  const instructorUser = {
    email: `instructor-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Instructor User',
    role: 'INSTRUCTOR',
  };

  beforeAll(async () => {
    // Register instructor
    const res = await request(app)
      .post('/api/auth/register')
      .send(instructorUser);
    
    instructorToken = res.body.token;
    instructorId = res.body.user.id;
  });

  afterAll(async () => {
    // Cleanup: delete course and instructor
    if (courseId) {
      await prisma.course.delete({ where: { id: courseId } }).catch(() => {});
    }
    await prisma.user.delete({ where: { id: instructorId } }).catch(() => {});
  });

  it('should create a new course', async () => {
    const courseData = {
      title: 'Test Course',
      description: 'Test Description',
      level: 'BEGINNER',
      price: 10.99,
      tags: ['test', 'vitest'],
    };

    const res = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send(courseData);

    expect(res.status).toBe(201);
    expect(res.body.course.title).toBe(courseData.title);
    courseId = res.body.course.id;
  });

  it('should get all courses', async () => {
    const res = await request(app).get('/api/courses');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a course by id', async () => {
    const res = await request(app).get(`/api/courses/${courseId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(courseId);
  });

  it('should update a course', async () => {
    const updateData = {
      title: 'Updated Test Course',
    };

    const res = await request(app)
      .put(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.course.title).toBe(updateData.title);
  });

  it('should not update a course if not the creator', async () => {
    // Register another user
    const otherUser = await request(app)
      .post('/api/auth/register')
      .send({
        email: `other-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Other User',
      });
    
    const res = await request(app)
      .put(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${otherUser.body.token}`)
      .send({ title: 'Hacked Title' });

    expect(res.status).toBe(403);
    
    // Cleanup other user
    await prisma.user.delete({ where: { id: otherUser.body.user.id } });
  });

  it('should delete a course', async () => {
    const res = await request(app)
      .delete(`/api/courses/${courseId}`)
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(res.status).toBe(200);
    courseId = null; // Prevent afterAll from failing if already deleted
  });
});
