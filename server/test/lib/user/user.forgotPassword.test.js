const { assert, expect } = require('chai');
const jwt = require('jsonwebtoken');

const db = require('../../../models');
const User = require('../../../lib/user');
const Session = require('../../../lib/session');
const { Cache } = require('../../../utils/cache');
const { hashRefreshToken } = require('../../../utils/refreshToken');

const USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';
const KNOWN_ORIGIN = 'https://gladys.example.com';

describe('user.forgotPassword', () => {
  const session = new Session('secret', new Cache());
  const user = new User(session);

  beforeEach(async () => {
    user.forgotPasswordCodes.clear();
    // an authenticated session was opened from KNOWN_ORIGIN
    await session.create(USER_ID, ['dashboard:write'], 60, 'chrome', KNOWN_ORIGIN);
  });

  it('should send a link when the origin was used by an authenticated session', async () => {
    const result = await user.forgotPassword('demo@demo.com', 'chrome', KNOWN_ORIGIN);
    expect(result.method).to.equal('link');
    expect(result).to.not.have.property('code');
    expect(result.user).to.have.property('language', 'en');
    expect(result.user).to.have.property('selector', 'john');
    expect(result.user).to.not.have.property('password');
    expect(result.link).to.match(/^https:\/\/gladys\.example\.com\/reset-password\?token=/);
    const token = result.link.split('token=')[1];
    const decoded = jwt.verify(token, 'secret');
    expect(decoded.user_id).to.equal(USER_ID);
    expect(decoded.scope).to.deep.equal(['reset-password:write']);
    // the token is short-lived
    expect(decoded.exp - decoded.iat).to.be.at.most(15 * 60);
    // the reset session did not record any origin
    const resetSession = await db.Session.findOne({ where: { id: decoded.session_id } });
    expect(resetSession.origin).to.equal(null);
    expect(resetSession.valid_until.getTime() - Date.now()).to.be.at.most(15 * 60 * 1000);
    expect(user.forgotPasswordCodes.size).to.equal(0);
  });

  it('should canonicalize the origin before checking it', async () => {
    const result = await user.forgotPassword('demo@demo.com', 'chrome', 'HTTPS://Gladys.Example.com:443/');
    expect(result.method).to.equal('link');
    expect(result.link).to.match(/^https:\/\/gladys\.example\.com\/reset-password\?token=/);
  });

  it('should send a code, not a link, when the origin is unknown', async () => {
    const result = await user.forgotPassword('demo@demo.com', 'chrome', 'https://attacker.example');
    expect(result.method).to.equal('code');
    expect(result).to.not.have.property('link');
    expect(result.code).to.match(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(result.code).to.not.match(/[01IO]/);
    expect(result.user).to.have.property('selector', 'john');
    const pending = user.forgotPasswordCodes.get(USER_ID);
    expect(pending.code_hash).to.equal(hashRefreshToken(result.code.replace('-', '')));
    expect(pending.attempts).to.equal(0);
    expect(pending.valid_until.getTime() - Date.now()).to.be.at.most(15 * 60 * 1000);
    // no reset session was created
    const resetSessions = await db.Session.findAll({ where: { user_id: USER_ID, scope: 'reset-password:write' } });
    expect(resetSessions).to.have.lengthOf(1); // the seeded one only
  });

  it('should send a code when the origin is missing or malformed', async () => {
    const noOrigin = await user.forgotPassword('demo@demo.com', 'chrome');
    expect(noOrigin.method).to.equal('code');
    const withPath = await user.forgotPassword('demo@demo.com', 'chrome', `${KNOWN_ORIGIN}/evil`);
    expect(withPath.method).to.equal('code');
    // eslint-disable-next-line no-script-url
    const notAnUrl = await user.forgotPassword('demo@demo.com', 'chrome', 'javascript:alert(1)');
    expect(notAnUrl.method).to.equal('code');
  });

  it('should send a code when the origin is only used by a revoked session', async () => {
    const created = await session.create(USER_ID, ['dashboard:write'], 60, 'chrome', 'https://attacker.example');
    await session.revoke(USER_ID, created.session_id);
    const result = await user.forgotPassword('demo@demo.com', 'chrome', 'https://attacker.example');
    expect(result.method).to.equal('code');
  });

  it('should send a code when the origin is only used by an expired session', async () => {
    await session.create(USER_ID, ['dashboard:write'], -60, 'chrome', 'https://attacker.example');
    const result = await user.forgotPassword('demo@demo.com', 'chrome', 'https://attacker.example');
    expect(result.method).to.equal('code');
  });

  it('should send a code when the origin is only used by a session of another user', async () => {
    // pepper logs in from attacker.example, that must not make it a link target for john
    await session.create('7a137a56-069e-4996-8816-36558174b727', ['dashboard:write'], 60, 'chrome', 'https://attacker.example');
    const result = await user.forgotPassword('demo@demo.com', 'chrome', 'https://attacker.example');
    expect(result.method).to.equal('code');
    const pepper = await user.forgotPassword('pepper@pots.com', 'chrome', 'https://attacker.example');
    expect(pepper.method).to.equal('link');
  });

  it('should not trust an origin only seen on a previous reset session', async () => {
    // a forgot password request from an unknown origin must not make it known
    await user.forgotPassword('demo@demo.com', 'chrome', 'https://attacker.example');
    const again = await user.forgotPassword('demo@demo.com', 'chrome', 'https://attacker.example');
    expect(again.method).to.equal('code');
  });

  it('should replace the pending code on a new request', async () => {
    const first = await user.forgotPassword('demo@demo.com', 'chrome');
    const second = await user.forgotPassword('demo@demo.com', 'chrome');
    expect(first.code).to.not.equal(second.code);
    expect(user.forgotPasswordCodes.size).to.equal(1);
    expect(user.forgotPasswordCodes.get(USER_ID).code_hash).to.equal(hashRefreshToken(second.code.replace('-', '')));
  });

  it('should return error, user not found', async () => {
    const promise = user.forgotPassword('not-found@test.com', 'chrome', KNOWN_ORIGIN);
    return assert.isRejected(promise, 'User not found');
  });
});
