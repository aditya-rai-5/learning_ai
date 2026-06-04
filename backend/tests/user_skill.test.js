import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.config.js';

describe('User Skills', () => {
  let userToken;
  let userId;
  let skillId;

  beforeAll(async () => {
    const userRes = await request(app).post('/api/auth/register').send({
      email: `skill-${Date.now()}@example.com`,
      password: 'password123',
      name: 'Skill User'
    });
    userToken = userRes.body.token;
    userId = userRes.body.user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  });

  it('should add a skill', async () => {
    const res = await request(app)
      .post('/api/user-skills')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ skillTag: 'JavaScript', proficiency: 80 });

    expect(res.status).toBe(201);
    expect(res.body.skill.skillTag).toBe('JavaScript');
    skillId = res.body.skill.id;
  });

  it('should get all skills', async () => {
    const res = await request(app)
      .get('/api/user-skills')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].skillTag).toBe('JavaScript');
  });

  it('should update an existing skill instead of duplicating', async () => {
    const res = await request(app)
      .post('/api/user-skills')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ skillTag: 'JavaScript', proficiency: 95 });

    expect([200, 201]).toContain(res.status);
    expect(res.body.skill.proficiency).toBe(95);

    // Verify it's still just one skill
    const getRes = await request(app).get('/api/user-skills').set('Authorization', `Bearer ${userToken}`);
    expect(getRes.body.length).toBe(1);
  });

  it('should remove a skill', async () => {
    // Controller accepts ID or tag
    const res = await request(app)
      .delete(`/api/user-skills/${skillId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);

    const getRes = await request(app).get('/api/user-skills').set('Authorization', `Bearer ${userToken}`);
    expect(getRes.body.length).toBe(0);
  });
});
