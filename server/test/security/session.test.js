const { expect } = require('chai');
const { authenticatedRequest } = require('../controllers/request.test');

describe('/api/v1/session/', () => {
  it('should return the sessionIds of current user', async () => {
    await authenticatedRequest
      .get('/api/v1/session')
      .expect('Content-Type', /json/)
      .expect(200)
      .then(async (res) => {
        const userId = '0cd30aef-9c4e-4a23-88e3-3547971296e5';
        res.body.forEach((u) => {
          expect(u.user_id).to.be.equal(userId);
        });
      });
  });
});
