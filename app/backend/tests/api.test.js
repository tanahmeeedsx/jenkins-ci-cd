process.env.JWT_SECRET = process.env.JWT_SECRET || 'noteshub-test-secret';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../server');

test('GET /api/health returns healthy status', async () => {
    const response = await request(app).get('/api/health');

    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'healthy');
    assert.equal(response.body.service, 'NotesHub API');
});

test('GET /api/notes rejects requests without a token', async () => {
    const response = await request(app).get('/api/notes');

    assert.equal(response.status, 401);
    assert.equal(response.body.message, 'Authentication required');
});

test('GET /api/notes rejects invalid JWT tokens', async () => {
    const response = await request(app)
        .get('/api/notes')
        .set('Authorization', 'Bearer invalid-token');

    assert.equal(response.status, 401);
    assert.equal(response.body.message, 'Invalid or expired token');
});
