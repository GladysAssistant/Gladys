const { expect } = require('chai');
const db = require('../../../models');
const { Cache } = require('../../../utils/cache');
const Session = require('../../../lib/session');
const { Error401, Error403 } = require('../../../utils/httpErrors');
const { generateAccessToken, ACCESS_TOKEN_VALIDITY } = require('../../../utils/accessToken');
const { SESSION_TOKEN_TYPES } = require('../../../utils/constants');

const USER_ID = '0cd30aef-9c4e-4a23-88e3-3547971296e5';
const HOUSE_ID = 'a741dfa6-24de-4b46-afc7-370772f068d5';

const insertSession = (id, { revoked = false, tabletModeLocked = false, updatedAt = new Date() } = {}) =>
  db.sequelize.getQueryInterface().bulkInsert('t_session', [
    {
      id,
      user_id: USER_ID,
      token_type: SESSION_TOKEN_TYPES.REFRESH_TOKEN,
      token_hash: 'token-hash',
      scope: 'dashboard:read',
      revoked,
      tablet_mode: tabletModeLocked,
      tablet_mode_locked: tabletModeLocked,
      valid_until: new Date(Date.now() + 10000000),
      created_at: updatedAt,
      updated_at: updatedAt,
    },
  ]);

const createTabletSession = async (session) => {
  const { session_id: sessionId } = await session.create(USER_ID, ['dashboard:read'], 60, 'tablet');
  await db.Session.update({ tablet_mode: true, current_house_id: HOUSE_ID }, { where: { id: sessionId } });
  return sessionId;
};

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
    await insertSession(recentlyRevokedId, {
      revoked: true,
      updatedAt: new Date(now - (ACCESS_TOKEN_VALIDITY - 60) * 1000),
    });
    await insertSession(oldRevokedId, {
      revoked: true,
      updatedAt: new Date(now - (ACCESS_TOKEN_VALIDITY + 60) * 1000),
    });
    const cache = new Cache();
    const session = new Session('secret', cache);
    await session.init();
    expect(cache.get(`revoked_session:${recentlyRevokedId}`)).to.equal(true);
    // all access tokens of this session have expired, there is nothing to refuse
    expect(cache.get(`revoked_session:${oldRevokedId}`)).to.equal(undefined);
  });
  it('should not load a session which is neither revoked nor locked', async () => {
    const activeId = 'c3e3d9b6-4c0a-4f7d-9e65-8b4a3f2d0c33';
    await insertSession(activeId);
    const cache = new Cache();
    const session = new Session('secret', cache);
    await session.init();
    expect(cache.get(`revoked_session:${activeId}`)).to.equal(undefined);
    expect(cache.get(`tablet_mode_locked:${activeId}`)).to.equal(undefined);
    const accessToken = generateAccessToken(USER_ID, ['dashboard:read'], activeId, 'secret');
    expect(session.validateAccessToken(accessToken, 'dashboard:read')).to.have.property('session_id', activeId);
  });
  it('should keep a locked tablet locked after a restart', async () => {
    const sessionBeforeRestart = new Session('secret', new Cache());
    const sessionId = await createTabletSession(sessionBeforeRestart);
    await sessionBeforeRestart.setTabletModeLocked(HOUSE_ID);
    const dashboardAccessToken = generateAccessToken(USER_ID, ['dashboard:read'], sessionId, 'secret');
    const alarmAccessToken = generateAccessToken(USER_ID, ['alarm:write'], sessionId, 'secret');
    // a restart empties the RAM cache: the tablet is unlocked
    const sessionAfterRestart = new Session('secret', new Cache());
    expect(sessionAfterRestart.validateAccessToken(dashboardAccessToken, 'dashboard:read')).to.have.property(
      'session_id',
      sessionId,
    );
    await sessionAfterRestart.init();
    expect(() => sessionAfterRestart.validateAccessToken(dashboardAccessToken, 'dashboard:read')).to.throw(
      Error403,
      'TABLET_IS_LOCKED',
    );
    // the alarm can still be disarmed from the tablet
    expect(sessionAfterRestart.validateAccessToken(alarmAccessToken, 'alarm:write')).to.have.property(
      'session_id',
      sessionId,
    );
  });
  it('should not load the lock of an unlocked or revoked tablet', async () => {
    const sessionBeforeRestart = new Session('secret', new Cache());
    const unlockedId = await createTabletSession(sessionBeforeRestart);
    await sessionBeforeRestart.setTabletModeLocked(HOUSE_ID);
    await sessionBeforeRestart.unlockTabletMode(HOUSE_ID);
    const revokedLockedId = 'd4f4e0c7-5d1b-4a8e-af76-9c5b4a3e1d44';
    await insertSession(revokedLockedId, { revoked: true, tabletModeLocked: true });
    const cache = new Cache();
    const sessionAfterRestart = new Session('secret', cache);
    await sessionAfterRestart.init();
    expect(cache.get(`tablet_mode_locked:${unlockedId}`)).to.equal(undefined);
    expect(cache.get(`tablet_mode_locked:${revokedLockedId}`)).to.equal(undefined);
  });
});
