const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('POST /api/v1/session/:session_id/revoke', () => {
  it('should revoke session', async () => {
    await authenticatedRequest
      .post('/api/v1/session/ada07710-5f25-4510-ac63-b002aca3bd32/revoke')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('id', 'ada07710-5f25-4510-ac63-b002aca3bd32');
      });
  });
  it('should return 404 not found', async () => {
    await authenticatedRequest
      .post('/api/v1/session/ec595260-c538-4092-b76f-fde9f8a3b1c0/revoke')
      .expect('Content-Type', /json/)
      .expect(404)
      .then((res) => {
        expect(res.body).to.deep.equal({
          status: 404,
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      });
  });
});

describe('POST /api/v1/session/api_key', () => {
  it('should create api key', async () => {
    await authenticatedRequest
      .post('/api/v1/session/api_key')
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.have.property('api_key');
        expect(res.body).to.have.property('session_id');
      });
  });
});

describe('GET /api/v1/session', () => {
  it('should get api key list', async () => {
    await authenticatedRequest
      .get('/api/v1/session')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        res.body.forEach((oneSession) => {
          expect(oneSession).to.have.property('token_type');
          expect(oneSession).not.to.have.property('token_hash');
        });
      });
  });
  it('should return empty array', async () => {
    await authenticatedRequest
      .get('/api/v1/session?skip=10000')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
        expect(res.body).to.have.lengthOf(0);
      });
  });
});
