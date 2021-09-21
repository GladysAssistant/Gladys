const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('PATCH /api/v1/user/:user_selector', () => {
  it('should return the updated user', async () => {
    await authenticatedRequest
      .patch('/api/v1/user/pepper')
      .send({
        firstname: 'pepper-new-first-name',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('firstname', 'pepper-new-first-name');
      });
  });
  it('should return 404 not found', async () => {
    await authenticatedRequest
      .patch('/api/v1/user/USER_NOT_FOUND')
      .send({
        firstname: 'pepper-new-first-name',
      })
      .expect('Content-Type', /json/)
      .expect(404);
  });
});
