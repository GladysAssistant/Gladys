const { expect } = require('chai');
const { request } = require('../request.test');

describe('POST /api/v1/forgot_password', () => {
  it('should return success', async () => {
    await request
      .post('/api/v1/forgot_password')
      .send({
        email: 'demo@demo.com',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('success', true);
      });
  });
  it('should return 404 not found', async () => {
    await request
      .post('/api/v1/forgot_password')
      .send({
        email: 'does-not-exist@test.com',
      })
      .expect('Content-Type', /json/)
      .expect(404)
      .then((res) => {
        expect(res.body).to.deep.equal({
          status: 404,
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      });
  });
});
