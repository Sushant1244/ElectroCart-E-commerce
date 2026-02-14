const request = require('supertest');
const { server, app } = require('../server');

describe('Basic API', () => {
  test('GET / returns 200 and API running text', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/API running/i);
  }, 10000);
});
