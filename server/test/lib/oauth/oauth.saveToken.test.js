const { expect, assert } = require('chai');
const OauthManager = require('../../../lib/oauth');
const UserManager = require('../../../lib/user');

describe('oauth.saveToken', () => {
  const oauthManager = new OauthManager(new UserManager());

  it('should create authorization token', async () => {
    const authorizationCode = {
      access_token: '1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      access_token_expires_on: new Date('2019-09-01T06:44:14.048Z'),
      refresh_token: '2/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      refresh_token_expires_on: new Date('2019-09-10T06:44:14.048Z'),
    };
    const client = {
      client_id: 'oauth_client_1',
    };
    const user = {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    };

    const createdAuthorizationCode = await oauthManager.saveToken(authorizationCode, client, user);
    expect(createdAuthorizationCode).to.deep.include({
      access_token: '1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      access_token_expires_on: new Date('2019-09-01T06:44:14.048Z'),
      refresh_token: '2/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      refresh_token_expires_on: new Date('2019-09-10T06:44:14.048Z'),
      user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
  });

  it('should create authorization token on missing client', async () => {
    const authorizationCode = {
      access_token: '1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      access_token_expires_on: new Date('2019-09-01T06:44:14.048Z'),
      refresh_token: '2/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      refresh_token_expires_on: new Date('2019-09-10T06:44:14.048Z'),
    };
    const client = {
      client_id: 'oauth_client_unknown',
    };
    const user = {
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    };

    const createdAuthorizationCode = await oauthManager.saveToken(authorizationCode, client, user);
    expect(createdAuthorizationCode).to.deep.include({
      access_token: '1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      access_token_expires_on: new Date('2019-09-01T06:44:14.048Z'),
      refresh_token: '2/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      refresh_token_expires_on: new Date('2019-09-10T06:44:14.048Z'),
      user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
  });

  it('should not create authorization token on missing user', async () => {
    const authorizationCode = {
      access_token: '1/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      access_token_expires_on: new Date('2019-09-01T06:44:14.048Z'),
      refresh_token: '2/mZ1edKKACtPAb7zGlwSzvs72PvhAbGmB8K1ZrGxpcNM',
      refresh_token_expires_on: new Date('2019-09-10T06:44:14.048Z'),
    };
    const client = {
      client_id: 'oauth_client_2',
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
