import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.config.js';

describe('Auth Endpoints', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    name: 'Test User',
  };

  afterAll(async () => {
    // Cleanup: delete the test user
    await prisma.user.delete({
      where: { email: testUser.email },
    }).catch(() => { }); // Ignore if already deleted
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body).toHaveProperty('token');
  });

  it('should login the registered user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body).toHaveProperty('token');
  });

  it('should not register a user with an existing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(400); // Assuming 400 for user exists
    expect(res.body).toHaveProperty('error');
  });

  it('should not login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});
