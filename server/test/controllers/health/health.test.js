const { expect } = require('chai');
const { request, authenticatedRequest } = require('../request.test');

describe('GET /api/v1/user/:selector/health', () => {
  it('should return the health configure in user is', async () => {
    await authenticatedRequest
      .get('/api/v1/user/john/health')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({});
      });
  });
  it('should return 401 unauthorized', async () => {
    await request
      .get('/api/v1/user/john/health')
      .expect('Content-Type', /json/)
      .expect(401);
  });
});
