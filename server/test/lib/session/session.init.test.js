const { expect } = require('chai');
const db = require('../../../models');
const { Cache } = require('../../../utils/cache');
const Session = require('../../../lib/session');
const { Error401 } = require('../../../utils/httpErrors');
const { generateAccessToken, ACCESS_TOKEN_VALIDITY } = require('../../../utils/accessToken');
const { SESSION_TOKEN_TYPES } = require('../../../utils/constants');

const USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';

const insertSession = (id, revoked, updatedAt) =>
  db.sequelize.getQueryInterface().bulkInsert('t_session', [
    {
      id,
      user_id: USER_ID,
      token_type: SESSION_TOKEN_TYPES.REFRESH_TOKEN,
      token_hash: 'token-hash',
      scope: 'dashboard:read',
      revoked,
      valid_until: new Date(Date.now() + 10000000),
      created_at: updatedAt,
      updated_at: updatedAt,
    },
  ]);

describe('session.init', () => {
  it('should keep refusing the access token of a revoked session after a restart', async () => {
    const sessionBeforeRestart = new Session('secret', new Cache());
    const { session_id: sessionId, access_token: accessToken } = await sessionBeforeRestart.create(
      USER_ID,
      ['dashboard:read'],
      60,
      'android',
    );
    await sessionBeforeRestart.revoke(USER_ID, sessionId);
    // a restart empties the RAM cache: the access token is accepted again
    const sessionAfterRestart = new Session('secret', new Cache());
    expect(sessionAfterRestart.validateAccessToken(accessToken, 'dashboard:read')).to.have.property(
      'session_id',
      sessionId,
    );
    await sessionAfterRestart.init();
    expect(() => sessionAfterRestart.validateAccessToken(accessToken, 'dashboard:read')).to.throw(
      Error401,
      'AuthMiddleware: Session was revoked',
    );
  });
  it('should only load the sessions revoked within the access token validity', async () => {
    const now = Date.now();
    const recentlyRevokedId = 'a1c1b7f4-2a8e-4d5b-9c43-6f2e1d0b8a11';
    const oldRevokedId = 'b2d2c8a5-3b9f-4e6c-8d54-7a3f2e1c9b22';
    await insertSession(recentlyRevokedId, true, new Date(now - (ACCESS_TOKEN_VALIDITY - 60) * 1000));
    await insertSession(oldRevokedId, true, new Date(now - (ACCESS_TOKEN_VALIDITY + 60) * 1000));
    const cache = new Cache();
    const session = new Session('secret', cache);
    await session.init();
    expect(cache.get(`revoked_session:${recentlyRevokedId}`)).to.equal(true);
    // all access tokens of this session have expired, there is nothing to refuse
    expect(cache.get(`revoked_session:${oldRevokedId}`)).to.equal(undefined);
  });
  it('should not load a session which is not revoked', async () => {
    const activeId = 'c3e3d9b6-4c0a-4f7d-9e65-8b4a3f2d0c33';
    await insertSession(activeId, false, new Date());
    const cache = new Cache();
    const session = new Session('secret', cache);
    await session.init();
    expect(cache.get(`revoked_session:${activeId}`)).to.equal(undefined);
    const accessToken = generateAccessToken(USER_ID, ['dashboard:read'], activeId, 'secret');
    expect(session.validateAccessToken(accessToken, 'dashboard:read')).to.have.property('session_id', activeId);
  });
});
