const { expect } = require('chai');
const { authenticatedRequest } = require('../controllers/request.test');

describe('/api/v1/user/', () => {
  it('should return all users without password', async () => {
    await authenticatedRequest
      .get('/api/v1/user?fields=password')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        res.body.forEach((user) => {
          expect(user).to.not.have.property('password');
        });
      });
  });
});
