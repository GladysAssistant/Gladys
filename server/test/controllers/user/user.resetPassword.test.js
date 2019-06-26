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
  it('should return error 422, password too short', async () => {
    await authenticatedRequest
      .post('/api/v1/reset_password')
      .send({
        password: 'short',
      })
      .expect('Content-Type', /json/)
      .expect(422)
      .then((res) => {
        expect(res.body).to.deep.equal({
          status: 422,
          code: 'UNPROCESSABLE_ENTITY',
          properties: [
            {
              message: 'Validation len on password failed',
              attribute: 'password',
              value: 'short',
              type: 'Validation error',
            },
          ],
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
