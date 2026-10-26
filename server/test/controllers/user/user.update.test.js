const { expect } = require('chai');
const db = require('../../../models');
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
  it('should log out the sessions of the user when the password changes', async () => {
    // @ts-ignore
    const pepperSession = await global.TEST_GLADYS_INSTANCE.session.create(
      '7a137a56-069e-4996-8816-36558174b727',
      ['dashboard:write'],
      60,
    );
    await authenticatedRequest
      .patch('/api/v1/user/pepper')
      .send({
        password: 'pepper-new-password',
      })
      .expect('Content-Type', /json/)
      .expect(200);
    const pepperSessionInDb = await db.Session.findByPk(pepperSession.session_id);
    expect(pepperSessionInDb.revoked).to.equal(true);
    const adminSession = await db.Session.findByPk('baf1fa89-153b-4f2e-adf3-787e410ec291');
    expect(adminSession.revoked).to.equal(false);
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
  it('should return 400 when the last administrator removes their own admin role', async () => {
    await db.User.update({ role: 'habitant' }, { where: { selector: 'pepper' } });
    await authenticatedRequest
      .patch('/api/v1/user/john')
      .send({
        role: 'habitant',
      })
      .expect('Content-Type', /json/)
      .expect(400);
    const john = await db.User.findOne({ where: { selector: 'john' } });
    expect(john).to.have.property('role', 'admin');
  });
});
