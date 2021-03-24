const { expect, assert } = require('chai');
const OauthManager = require('../../../lib/oauth');
const UserManager = require('../../../lib/user');
const SessionManager = require('../../../lib/session');

describe('oauth.saveToken', () => {
  const oauthManager = new OauthManager(new UserManager(), new SessionManager());

  it('should create authorization token', async () => {
    const authorizationCode = {
      accessToken: '1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      accessTokenExpiresAt: new Date('2019-09-01T06:44:14.048Z'),
      refreshToken: '2/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      refreshTokenExpiresAt: new Date('2019-09-10T06:44:14.048Z'),
    };
    const client = {
      id: 'oauth_client_1',
    };
    const user = {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    };

    const createdAuthorizationCode = await oauthManager.saveToken(authorizationCode, client, user);
    expect(createdAuthorizationCode).to.deep.include({
      accessToken: '1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      accessTokenExpiresAt: new Date('2019-09-01T06:44:14.048Z'),
      refreshToken: '2/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      refreshTokenExpiresAt: new Date('2019-09-10T06:44:14.048Z'),
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      client: {
        id: 'oauth_client_1',
      },
    });
  });

  it('should create authorization token on missing client', async () => {
    const authorizationCode = {
      accessToken: '1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      accessTokenExpiresAt: new Date('2019-09-01T06:44:14.048Z'),
      refreshToken: '2/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      refreshTokenExpiresAt: new Date('2019-09-10T06:44:14.048Z'),
    };
    const client = {
      id: 'oauth_client_unknown',
    };
    const user = {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    };

    const createdAuthorizationCode = await oauthManager.saveToken(authorizationCode, client, user);
    expect(createdAuthorizationCode).to.deep.include({
      accessToken: '1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      accessTokenExpiresAt: new Date('2019-09-01T06:44:14.048Z'),
      refreshToken: '2/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      refreshTokenExpiresAt: new Date('2019-09-10T06:44:14.048Z'),
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      client: {
        id: 'oauth_client_unknown',
      },
    });
  });

  it('should not create authorization token on missing user', async () => {
    const authorizationCode = {
      accessToken: '1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      accessTokenExpiresAt: new Date('2019-09-01T06:44:14.048Z'),
      refreshToken: '2/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      refreshTokenExpiresAt: new Date('2019-09-10T06:44:14.048Z'),
    };
    const client = {
      id: 'oauth_client_2',
    };
    const user = {
      id: 'nobody-s-id',
    };

    try {
      await oauthManager.saveToken(authorizationCode, client, user);
      assert.fail('Should fail because OAuth client does not exist');
    } catch (e) {
      expect(e.original.errno).to.eq(19);
    }
  });
});
