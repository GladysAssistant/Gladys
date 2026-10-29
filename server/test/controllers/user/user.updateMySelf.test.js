const { expect } = require('chai');
const db = require('../../../models');
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
  it('should log out the other sessions of the user when the password changes', async () => {
    await authenticatedRequest
      .patch('/api/v1/me')
      .send({
        password: 'my-new-password',
      })
      .expect('Content-Type', /json/)
      .expect(200);
    const otherSession = await db.Session.findByPk('ada07710-5f25-4510-ac63-b002aca3bd32');
    expect(otherSession.revoked).to.equal(true);
    // the session the password was changed from can still be used
    await authenticatedRequest
      .get('/api/v1/me')
      .expect('Content-Type', /json/)
      .expect(200);
  });
  it('should return 401 unauthorized', async () => {
    await request
      .patch('/api/v1/me')
      .expect('Content-Type', /json/)
      .expect(401);
  });
});
