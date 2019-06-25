const { expect } = require('chai');
const { request, authenticatedRequest } = require('../request.test');

describe('PATCH /api/v1/me', () => {
  it('should return the updated user', async () => {
    await authenticatedRequest
      .patch('/api/v1/me')
      .send({
        firstname: 'new-first-name',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('id');
      });
  });
  it('should return 401 unauthorized', async () => {
    await request
      .patch('/api/v1/me')
      .expect('Content-Type', /json/)
      .expect(401);
  });
});
