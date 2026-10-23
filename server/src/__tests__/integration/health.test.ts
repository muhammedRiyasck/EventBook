import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app';

describe('API Integration - Health & Error Handling', () => {
  it('GET /api/health returns 200 with service status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.message).toContain('EventBook API is running');
  });

  it('GET /api/unknown-route returns standard 404 response', async () => {
    const res = await request(app).get('/api/unknown-route');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toBe('Route not found');
  });

  it('POST /api/auth/login with empty body returns 400 validation error', async () => {
    const res = await request(app).post('/api/auth/login').send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message');
  });

  it('GET /api/docs.json returns valid OpenAPI 3.0 specification', async () => {
    const res = await request(app).get('/api/docs.json');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('openapi', '3.0.3');
    expect(res.body.info).toHaveProperty('title');
    expect(res.body.paths).toHaveProperty('/api/health');
    expect(res.body.paths).toHaveProperty('/api/bookings');
  });

  it('GET /api/docs/ returns HTML Swagger UI page', async () => {
    const res = await request(app).get('/api/docs/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
  });
});
