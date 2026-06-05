import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.config.js';

describe('Learning Paths', () => {
  let instructorToken;
  let instructorId;
  let course1Id;
  let course2Id;
  let pathId;

  beforeAll(async () => {
    const userRes = await request(app).post('/api/auth/register').send({
      email: `path-inst-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Path Instructor',
      role: 'INSTRUCTOR'
    });
    instructorToken = userRes.body.token;
    instructorId = userRes.body.user.id;

    const c1Res = await request(app).post('/api/courses').set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'Course 1', description: 'desc', price: 0 });
    course1Id = c1Res.body.course.id;

    const c2Res = await request(app).post('/api/courses').set('Authorization', `Bearer ${instructorToken}`)
      .send({ title: 'Course 2', description: 'desc', price: 0 });
    course2Id = c2Res.body.course.id;
  });

  afterAll(async () => {
    if (pathId) await prisma.learningPath.delete({ where: { id: pathId } }).catch(() => {});
    await prisma.course.deleteMany({ where: { id: { in: [course1Id, course2Id] } } }).catch(() => {});
    await prisma.user.delete({ where: { id: instructorId } }).catch(() => {});
  });

  it('should create a learning path', async () => {
    const res = await request(app)
      .post('/api/learning-paths')
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Full Stack Path',
        description: 'Learn it all',
        accentColor: '#6a1b9a',
        tags: ['web'],
        courses: [
          { courseId: course1Id, order: 1 },
          { courseId: course2Id, order: 2 }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.path.title).toBe('Full Stack Path');
    expect(res.body.path.accentColor).toBe('#6a1b9a');
    expect(res.body.path.courses.length).toBe(2);
    pathId = res.body.path.id;
  });

  it('should get all learning paths', async () => {
    const res = await request(app).get('/api/learning-paths');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a learning path by ID', async () => {
    const res = await request(app).get(`/api/learning-paths/${pathId}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Full Stack Path');
    expect(res.body.courses.length).toBe(2);
  });

  it('should update a learning path', async () => {
    const res = await request(app)
      .put(`/api/learning-paths/${pathId}`)
      .set('Authorization', `Bearer ${instructorToken}`)
      .send({
        title: 'Updated Path',
        courses: [
          { courseId: course1Id, order: 1 } // Removed course 2
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.path.title).toBe('Updated Path');
    expect(res.body.path.courses.length).toBe(1);
  });

  it('should delete a learning path', async () => {
    const res = await request(app)
      .delete(`/api/learning-paths/${pathId}`)
      .set('Authorization', `Bearer ${instructorToken}`);

    expect(res.status).toBe(200);
    pathId = null;
  });
});
