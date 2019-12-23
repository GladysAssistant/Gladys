const { expect } = require('chai');
const { request, authenticatedRequest } = require('../request.test');

describe('POST /api/v1/reset_password', () => {
  it('should return user id', async () => {
    await authenticatedRequest
      .post('/api/v1/reset_password')
      .send({
        password: 'my-new-password',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('id', '0cd30aef-9c4e-4a23-88e3-3547971296e5');
      });
  });
  it('should return error 400, password too short', async () => {
    await authenticatedRequest
      .post('/api/v1/reset_password')
      .send({
        password: 'short',
      })
      .expect('Content-Type', /json/)
      .expect(400)
      .then((res) => {
        expect(res.body).to.deep.equal({
          status: 400,
          code: 'BAD_REQUEST',
          message: 'Password is too short',
        });
      });
  });
  it('should return 401', async () => {
    await request
      .post('/api/v1/reset_password')
      .send({
        password: 'my-new-password',
      })
      .expect('Content-Type', /json/)
      .expect(401);
  });
});
