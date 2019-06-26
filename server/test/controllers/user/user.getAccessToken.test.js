const { expect } = require('chai');
const { request } = require('../request.test');

describe('POST /api/v1/access_token', () => {
  it('should return a new access token', async () => {
    await request
      .post('/api/v1/access_token')
      .send({
        refresh_token: 'refresh-token-test',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('access_token');
      });
  });
  it('should return error 400, empty refresh token', async () => {
    await request
      .post('/api/v1/access_token')
      .send({
        refresh_token: null,
      })
      .expect('Content-Type', /json/)
      .expect(400);
  });
  it('should return 401 unauthorized', async () => {
    await request
      .post('/api/v1/access_token')
      .send({
        refresh_token: 'refresh-token-does-not-exist',
      })
      .expect('Content-Type', /json/)
      .expect(401)
      .then((res) => {
        expect(res.body).to.deep.equal({
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Session not found',
        });
      });
  });
  it('should return 401 unauthorized', async () => {
    await request
      .post('/api/v1/access_token')
      .send({
        refresh_token: 'refresh-token-test-expired',
      })
      .expect('Content-Type', /json/)
      .expect(401)
      .then((res) => {
        expect(res.body).to.deep.equal({
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Session has expired',
        });
      });
  });
});
