const { request } = require('../request.test');

describe('GET /api/v1/ping', () => {
  it('should return ping', async () => {
    await request
      .get('/api/v1/ping')
      .expect('Content-Type', /json/)
      .expect(200);
  });
});
