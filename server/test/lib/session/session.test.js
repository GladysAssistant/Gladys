const { expect, assert } = require('chai');
const db = require('../../../models');
const { Cache } = require('../../../utils/cache');
const Session = require('../../../lib/session');

describe('session.create', () => {
  it('should create a refresh token valid 60 seconds', async () => {
    const session = new Session('secret');
    const res = await session.create('0cd30aef-9c4e-4a23-88e3-3547971296e5', ['dashboard:read'], 60, 'android');
    expect(res).to.have.property('refresh_token');
    expect(res).to.have.property('access_token');
    expect(res).to.have.property('session_id');
    const sessionInDb = await db.Session.findOne({ where: { id: res.session_id } });
    expect(sessionInDb.origin).to.equal(null);
  });
  it('should store the canonical origin of an authenticated session', async () => {
    const session = new Session('secret');
    const res = await session.create(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      ['dashboard:read'],
      60,
      'android',
      'HTTP://Gladys.local:80/',
    );
    const sessionInDb = await db.Session.findOne({ where: { id: res.session_id } });
    expect(sessionInDb.origin).to.equal('http://gladys.local');
  });
  it('should not store an invalid origin', async () => {
    const session = new Session('secret');
    const res = await session.create(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      ['dashboard:read'],
      60,
      'android',
      'http://gladys.local/some/path',
    );
    const sessionInDb = await db.Session.findOne({ where: { id: res.session_id } });
    expect(sessionInDb.origin).to.equal(null);
  });
});

describe('session.createApiKey', () => {
  it('should create an api key', async () => {
    const session = new Session('secret');
    const res = await session.createApiKey('0cd30aef-9c4e-4a23-88e3-3547971296e5', ['dashboard:read']);
    expect(res).to.have.property('api_key');
    expect(res).to.have.property('session_id');
    expect(res.api_key).to.have.lengthOf(32);
  });
});

describe('session.get', () => {
  it('should get sessions', async () => {
    const session = new Session('secret');
    const sessions = await session.get('0cd30aef-9c4e-4a23-88e3-3547971296e5');
    expect(sessions).to.be.instanceOf(Array);
    sessions.forEach((oneSession) => {
      expect(oneSession).to.have.property('token_type');
      expect(oneSession).to.have.property('scope');
      expect(oneSession.scope).to.be.instanceOf(Array);
      expect(oneSession).not.to.have.property('token_hash');
    });
  });
});

describe('session.getAccessToken', () => {
  it('should return a new access token', async () => {
    const session = new Session('secret');
    const res = await session.getAccessToken('refresh-token-test', ['dashboard:read']);
    expect(res).to.have.property('access_token');
  });
  it('should return bad request error, refresh token is null', async () => {
    const session = new Session('secret');
    const promise = session.getAccessToken(null, ['dashboard:read']);
    return assert.isRejected(promise);
  });
  it('should return bad request error, refresh token is empty', async () => {
    const session = new Session('secret');
    const promise = session.getAccessToken('', ['dashboard:read']);
    return assert.isRejected(promise);
  });
  it('should return error, expired refresh token', async () => {
    const session = new Session('secret');
    const promise = session.getAccessToken('refresh-token-test-expired', ['dashboard:read']);
    return assert.isRejected(promise, 'Session has expired');
  });
  it('should return error, revoked refresh token', async () => {
    const session = new Session('secret');
    const promise = session.getAccessToken('refresh-token-test-revoked', ['dashboard:read']);
    return assert.isRejected(promise, 'Session was revoked');
  });
  it('should return error, session not found', async () => {
    const session = new Session('secret');
    const promise = session.getAccessToken('does-not-exist', ['dashboard:read']);
    return assert.isRejected(promise, 'Session not found');
  });
  it('should return bad request error, tablet mode is active (tablet locked)', async () => {
    const oneSession = await db.Session.findOne({
      where: {
        id: 'ada07710-5f25-4510-ac63-b002aca3bd32',
      },
    });
    await oneSession.update({ tablet_mode_locked: true });
    const session = new Session('secret');
    const promise = session.getAccessToken('refresh-token-test', ['dashboard:read']);
    return assert.isRejected(promise, 'TABLET_IS_LOCKED');
  });
});

describe('session.revoke', () => {
  const cache = new Cache();
  it('should revoke a session', async () => {
    const session = new Session('secret', cache);
    const revokedSession = await session.revoke(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'ada07710-5f25-4510-ac63-b002aca3bd32',
    );
    expect(revokedSession).to.deep.equal({
      id: 'ada07710-5f25-4510-ac63-b002aca3bd32',
      revoked: true,
    });
  });
  it('should return not found', async () => {
    const session = new Session('secret', cache);
    const promise = session.revoke('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'b85ebc3a-0e31-4218-b3fa-842b64322276');
    return assert.isRejected(promise, 'Session not found');
  });
});

describe('session.isRevoked', () => {
  it('should tell if a session was revoked', async () => {
    const session = new Session('secret', new Cache());
    expect(session.isRevoked('ada07710-5f25-4510-ac63-b002aca3bd32')).to.equal(false);
    await session.revoke('0cd30aef-9c4e-4a23-88e3-3547971296e5', 'ada07710-5f25-4510-ac63-b002aca3bd32');
    expect(session.isRevoked('ada07710-5f25-4510-ac63-b002aca3bd32')).to.equal(true);
  });
});

describe('session.revokeLoginSessions', () => {
  const getRevokedStates = async () => {
    const sessions = await db.Session.findAll({ attributes: ['id', 'revoked'] });
    return sessions.reduce((states, oneSession) => ({ ...states, [oneSession.id]: oneSession.revoked }), {});
  };
  it('should revoke the login sessions of the user, except the current one', async () => {
    const cache = new Cache();
    const session = new Session('secret', cache);
    const otherUserSession = await session.create('7a137a56-069e-4996-8816-36558174b727', ['dashboard:write'], 60);
    const accessToken = await session.getAccessToken('refresh-token-test', ['dashboard:write']);
    const revokedSessionIds = await session.revokeLoginSessions(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'baf1fa89-153b-4f2e-adf3-787e410ec291',
    );
    expect(revokedSessionIds).to.have.members([
      'ada07710-5f25-4510-ac63-b002aca3bd32',
      '91f656b4-48df-4cd0-89fd-c187c83a0427',
    ]);
    const revokedStates = await getRevokedStates();
    // login sessions of the user
    expect(revokedStates['ada07710-5f25-4510-ac63-b002aca3bd32']).to.equal(true);
    expect(revokedStates['91f656b4-48df-4cd0-89fd-c187c83a0427']).to.equal(true);
    // current session
    expect(revokedStates['baf1fa89-153b-4f2e-adf3-787e410ec291']).to.equal(false);
    // api key
    expect(revokedStates['77e0823e-17cd-42d2-b825-c386f5ce6f23']).to.equal(false);
    // session of another user
    expect(revokedStates[otherUserSession.session_id]).to.equal(false);
    // the access tokens already given are refused
    expect(() => session.validateAccessToken(accessToken.access_token, 'dashboard:write')).to.throw(
      'Session was revoked',
    );
    expect(cache.get('revoked_session:baf1fa89-153b-4f2e-adf3-787e410ec291')).to.equal(undefined);
    // and the refresh token cannot give new ones
    const promise = session.getAccessToken('refresh-token-test', ['dashboard:write']);
    return assert.isRejected(promise, 'Session was revoked');
  });
  it('should revoke all login sessions of the user', async () => {
    const cache = new Cache();
    const session = new Session('secret', cache);
    const revokedSessionIds = await session.revokeLoginSessions('0cd30aef-9c4e-4a23-88e3-3547971296e5');
    expect(revokedSessionIds).to.have.members([
      'ada07710-5f25-4510-ac63-b002aca3bd32',
      'baf1fa89-153b-4f2e-adf3-787e410ec291',
      '91f656b4-48df-4cd0-89fd-c187c83a0427',
    ]);
    expect(cache.get('revoked_session:baf1fa89-153b-4f2e-adf3-787e410ec291')).to.equal(true);
    const revokedStates = await getRevokedStates();
    expect(revokedStates['baf1fa89-153b-4f2e-adf3-787e410ec291']).to.equal(true);
    expect(revokedStates['77e0823e-17cd-42d2-b825-c386f5ce6f23']).to.equal(false);
  });
  it('should do nothing when the user has no login session', async () => {
    const session = new Session('secret', new Cache());
    const revokedSessionIds = await session.revokeLoginSessions('7a137a56-069e-4996-8816-36558174b727');
    expect(revokedSessionIds).to.deep.equal([]);
  });
});

describe('session.validateAccessToken', () => {
  it('should return error, tablet is locked', async () => {
    const cache = new Cache();
    const session = new Session('secret', cache);
    const accessTokenDashboard = await session.getAccessToken('refresh-token-test', ['dashboard:write']);
    const accessTokenAlarm = await session.getAccessToken('refresh-token-test', ['alarm:write']);
    const oneSession = await db.Session.findOne({
      where: {
        id: 'ada07710-5f25-4510-ac63-b002aca3bd32',
      },
    });
    await oneSession.update({ tablet_mode: true, current_house_id: 'a741dfa6-24de-4b46-afc7-370772f068d5' });
    await session.setTabletModeLocked('a741dfa6-24de-4b46-afc7-370772f068d5');
    try {
      session.validateAccessToken(accessTokenDashboard.access_token, 'dashboard:write');
      assert.fail('should fail');
    } catch (e) {
      expect(e.message).to.equal('TABLET_IS_LOCKED');
    }
    const res = session.validateAccessToken(accessTokenAlarm.access_token, 'alarm:write');
    expect(res).to.have.property('scope');
    expect(res).to.have.property('user_id', '0cd30aef-9c4e-4a23-88e3-3547971296e5');
  });
});

describe('session.validateApiKey', () => {
  it('should validate an api key', async () => {
    const session = new Session('secret');
    const userId = await session.validateApiKey('api-key-test', 'dashboard:write');
    expect(userId).to.equal('0cd30aef-9c4e-4a23-88e3-3547971296e5');
  });
  it('should return error, api key has expired', async () => {
    const session = new Session('secret');
    const promise = session.validateApiKey('api-key-test-expired', 'dashboard:write');
    return assert.isRejected(promise, 'Api key has expired');
  });
  it('should return error, api key was revoked', async () => {
    const session = new Session('secret');
    const promise = session.validateApiKey('api-key-test-revoked', 'dashboard:write');
    return assert.isRejected(promise, 'Api key was revoked');
  });
  it('should return error, api key not found', async () => {
    const session = new Session('secret');
    const promise = session.validateApiKey('api-key-not-found', 'dashboard:write');
    return assert.isRejected(promise, 'Api key not found');
  });
  it('should return error, api key does not have the required scope', async () => {
    const session = new Session('secret');
    const promise = session.validateApiKey('api-key-test', 'mcp');
    return assert.isRejected(promise, 'Api key does not have the required scope');
  });
});

describe('session.setTabletModeLocked', () => {
  const cache = new Cache();
  it('should lock one session', async () => {
    const oneSession = await db.Session.findOne({
      where: {
        id: 'ada07710-5f25-4510-ac63-b002aca3bd32',
      },
    });
    await oneSession.update({ tablet_mode: true, current_house_id: 'a741dfa6-24de-4b46-afc7-370772f068d5' });
    const session = new Session('secret', cache);
    const results = await session.setTabletModeLocked('a741dfa6-24de-4b46-afc7-370772f068d5');
    expect(results).to.deep.equal([
      {
        id: 'ada07710-5f25-4510-ac63-b002aca3bd32',
        tablet_mode_locked: true,
      },
    ]);
  });
});

describe('session.unlockTabletMode', () => {
  const cache = new Cache();
  it('should lock one session then unlock it', async () => {
    const oneSession = await db.Session.findOne({
      where: {
        id: 'ada07710-5f25-4510-ac63-b002aca3bd32',
      },
    });
    await oneSession.update({ tablet_mode: true, current_house_id: 'a741dfa6-24de-4b46-afc7-370772f068d5' });
    const session = new Session('secret', cache);
    await session.setTabletModeLocked('a741dfa6-24de-4b46-afc7-370772f068d5');
    const results = await session.unlockTabletMode('a741dfa6-24de-4b46-afc7-370772f068d5');
    expect(results).to.deep.equal([
      {
        id: 'ada07710-5f25-4510-ac63-b002aca3bd32',
        tablet_mode_locked: false,
      },
    ]);
  });
});
