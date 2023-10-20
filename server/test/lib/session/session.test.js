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
    const userId = await session.validateApiKey('api-key-test', ['dashboard:write']);
    expect(userId).to.equal('0cd30aef-9c4e-4a23-88e3-3547971296e5');
  });
  it('should return error, api key has expired', async () => {
    const session = new Session('secret');
    const promise = session.validateApiKey('api-key-test-expired', ['dashboard:write']);
    return assert.isRejected(promise, 'Api key has expired');
  });
  it('should return error, api key was revoked', async () => {
    const session = new Session('secret');
    const promise = session.validateApiKey('api-key-test-revoked', ['dashboard:write']);
    return assert.isRejected(promise, 'Api key was revoked');
  });
  it('should return error, api key not found', async () => {
    const session = new Session('secret');
    const promise = session.validateApiKey('api-key-not-found', ['dashboard:write']);
    return assert.isRejected(promise, 'Api key not found');
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

describe('session.setTabletMode', () => {
  const cache = new Cache();
  it('should set tablet mode to true', async () => {
    const session = new Session('secret', cache);
    await session.setTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'ada07710-5f25-4510-ac63-b002aca3bd32',
      true,
      'test-house',
    );
    const oneSession = await db.Session.findOne({
      where: {
        id: 'ada07710-5f25-4510-ac63-b002aca3bd32',
      },
      raw: true,
    });
    expect(oneSession).to.have.property('tablet_mode', 1);
    expect(oneSession).to.have.property('tablet_mode_locked', 0);
    expect(oneSession).to.have.property('current_house_id', 'a741dfa6-24de-4b46-afc7-370772f068d5');
  });
  it('should set tablet mode to false', async () => {
    const session = new Session('secret', cache);
    await session.setTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'ada07710-5f25-4510-ac63-b002aca3bd32',
      false,
      null,
    );
    const oneSession = await db.Session.findOne({
      where: {
        id: 'ada07710-5f25-4510-ac63-b002aca3bd32',
      },
      raw: true,
    });
    expect(oneSession).to.have.property('tablet_mode', 0);
    expect(oneSession).to.have.property('tablet_mode_locked', 0);
    expect(oneSession).to.have.property('current_house_id', null);
  });
  it('should return session not found', async () => {
    const session = new Session('secret', cache);
    const promise = session.setTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'eb260700-26d5-49ec-910f-aca90b42f585',
      true,
      'test-house',
    );
    await assert.isRejected(promise, 'Session not found');
  });
  it('should return house not found', async () => {
    const session = new Session('secret', cache);
    const promise = session.setTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'ada07710-5f25-4510-ac63-b002aca3bd32',
      true,
      'house not found',
    );
    await assert.isRejected(promise, 'House not found');
  });
});

describe('session.getTabletMode', () => {
  const cache = new Cache();
  it('should get tablet mode', async () => {
    const session = new Session('secret', cache);
    await session.setTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'ada07710-5f25-4510-ac63-b002aca3bd32',
      true,
      'test-house',
    );
    const oneSession = await session.getTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'ada07710-5f25-4510-ac63-b002aca3bd32',
    );
    expect(oneSession).to.have.property('tablet_mode', true);
    expect(oneSession).to.have.property('current_house_id', 'a741dfa6-24de-4b46-afc7-370772f068d5');
  });
  it('should return session not found', async () => {
    const session = new Session('secret', cache);
    const promise = session.getTabletMode(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'eb260700-26d5-49ec-910f-aca90b42f585',
    );
    await assert.isRejected(promise, 'Session not found');
  });
});
