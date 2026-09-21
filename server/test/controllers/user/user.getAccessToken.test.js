const { expect } = require('chai');
const { request } = require('../request.test');
const db = require('../../../models');

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
  it('should record the origin of a session which has none yet', async () => {
    await request
      .post('/api/v1/access_token')
      .set('Origin', 'http://gladys.local:1443')
      .send({
        refresh_token: 'refresh-token-test',
      })
      .expect(200);
    const session = await db.Session.findOne({ where: { id: 'ada07710-5f25-4510-ac63-b002aca3bd32' } });
    expect(session.origin).to.equal('http://gladys.local:1443');
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
