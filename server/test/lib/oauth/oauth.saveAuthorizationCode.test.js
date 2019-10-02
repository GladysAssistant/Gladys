const { expect, assert } = require('chai');
const db = require('../../../models');
const OauthManager = require('../../../lib/oauth');
const UserManager = require('../../../lib/user');
const SessionManager = require('../../../lib/session');

describe('oauth.saveAuthorizationCode', () => {
  const oauthManager = new OauthManager(new UserManager(), new SessionManager());

  beforeEach(async () => {
    db.OAuthAuthorizationCode.destroy({
      truncate: true,
    });
  });

  it('should create authorization key', async () => {
    const authorizationCode = {
      authorizationCode: 'AUTH_CODE',
      scope: 'scope',
      expiresAt: new Date('2019-09-01T06:44:14.048Z'),
      redirectUri: 'https://my-redirect.uri',
    };
    const client = {
      id: 'oauth_client_1',
    };
    const user = {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    };

    const createdAuthorizationCode = await oauthManager.saveAuthorizationCode(authorizationCode, client, user);
    expect(createdAuthorizationCode).to.deep.include({
      authorizationCode: 'AUTH_CODE',
      scope: 'scope',
      expiresAt: new Date('2019-09-01T06:44:14.048Z'),
      redirectUri: 'https://my-redirect.uri',
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      client: {
        id: 'oauth_client_1',
      },
    });
  });

  it('should not create authorization key on missing client', async () => {
    const authorizationCode = {
      authorizationCode: 'AUTH_CODE',
      scope: 'scope',
      expiresAt: new Date('2019-09-01T06:44:14.048Z'),
      redirectUri: 'https://my-redirect.uri',
    };
    const client = {
      id: 'oauth_client_unknown',
    };
    const user = {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    };

    try {
      await oauthManager.saveAuthorizationCode(authorizationCode, client, user);
      assert.fail('Should fail because OAuth client does not exist');
    } catch (e) {
      expect(e.original.errno).to.eq(19);
    }
  });

  it('should not create authorization key on missing user', async () => {
    const authorizationCode = {
      authorizationCode: 'AUTH_CODE',
      scope: 'scope',
      expiresAt: new Date('2019-09-01T06:44:14.048Z'),
      redirectUri: 'https://my-redirect.uri',
    };
    const client = {
      id: 'oauth_client_1',
    };
    const user = {
      id: 'nobody-s-id',
    };

    try {
      await oauthManager.saveAuthorizationCode(authorizationCode, client, user);
      assert.fail('Should fail because user does not exist');
    } catch (e) {
      expect(e.original.errno).to.eq(19);
    }
  });
});
