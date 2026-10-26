const { expect } = require('chai');
const { request } = require('../request.test');
const db = require('../../../models');

const KNOWN_ORIGIN = 'https://gladys.example.com';

describe('POST /api/v1/forgot_password', () => {
  beforeEach(async () => {
    // @ts-ignore
    global.TEST_GLADYS_INSTANCE.user.forgotPasswordCodes.clear();
  });
  it('should send a link when the origin was used to log in', async () => {
    await request
      .post('/api/v1/login')
      .set('Origin', KNOWN_ORIGIN)
      .send({
        email: 'demo@demo.com',
        password: 'mysuperpassword',
      })
      .expect(200);
    await request
      .post('/api/v1/forgot_password')
      .send({
        email: 'demo@demo.com',
        origin: KNOWN_ORIGIN,
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({ success: true });
      });
    // a link was sent: no code is pending and a reset session exists
    // @ts-ignore
    expect(global.TEST_GLADYS_INSTANCE.user.forgotPasswordCodes.size).to.equal(0);
    const resetSessions = await db.Session.findAll({
      where: { user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5', scope: 'reset-password:write' },
    });
    expect(resetSessions).to.have.lengthOf(2); // the seeded one and the new one
  });
  it('should send a code when the origin is unknown', async () => {
    await request
      .post('/api/v1/forgot_password')
      .send({
        email: 'demo@demo.com',
        origin: 'https://attacker.example',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({ success: true });
      });
    const resetSessions = await db.Session.findAll({
      where: { user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5', scope: 'reset-password:write' },
    });
    expect(resetSessions).to.have.lengthOf(1); // the seeded one only
    // @ts-ignore
    expect(global.TEST_GLADYS_INSTANCE.user.forgotPasswordCodes.size).to.equal(1);
  });
  it('should return 404 not found', async () => {
    await request
      .post('/api/v1/forgot_password')
      .send({
        email: 'does-not-exist@test.com',
        origin: KNOWN_ORIGIN,
      })
      .expect('Content-Type', /json/)
      .expect(404)
      .then((res) => {
        expect(res.body).to.deep.equal({
          status: 404,
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      });
  });
});

describe('POST /api/v1/forgot_password/code', () => {
  let code;
  beforeEach(async () => {
    // @ts-ignore
    const { user } = global.TEST_GLADYS_INSTANCE;
    user.forgotPasswordCodes.clear();
    ({ code } = await user.forgotPassword('demo@demo.com', 'test', 'https://unknown.example'));
  });
  it('should return a token able to reset the password', async () => {
    let accessToken;
    await request
      .post('/api/v1/forgot_password/code')
      .send({
        email: 'demo@demo.com',
        code,
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(Object.keys(res.body)).to.deep.equal(['access_token']);
        accessToken = res.body.access_token;
      });
    await request
      .post('/api/v1/reset_password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        password: 'my-new-password',
      })
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('id', '0cd30aef-9c4e-4a23-88e3-3547971296e5');
      });
  });
  it('should return 401 for a wrong code', async () => {
    await request
      .post('/api/v1/forgot_password/code')
      .send({
        email: 'demo@demo.com',
        code: 'AAAA-AAAA',
      })
      .expect('Content-Type', /json/)
      .expect(401)
      .then((res) => {
        expect(res.body).to.deep.equal({
          status: 401,
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired code',
        });
      });
  });
  it('should return 401 for an unknown email', async () => {
    await request
      .post('/api/v1/forgot_password/code')
      .send({
        email: 'does-not-exist@test.com',
        code,
      })
      .expect('Content-Type', /json/)
      .expect(401);
  });
});
