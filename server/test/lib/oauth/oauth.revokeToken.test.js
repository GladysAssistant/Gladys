const { expect } = require('chai');
const OauthManager = require('../../../lib/oauth');
const UserManager = require('../../../lib/user');

describe('oauth.revokeToken', () => {
  const oauthManager = new OauthManager(new UserManager(), {});

  it('should revoke token', async () => {
    const token = {
      refreshToken: 'oauth-refresh-token',
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      client: {
        id: 'oauth_client_1',
      },
    };
    const result = await oauthManager.revokeToken(token);
    expect(result).to.eq(true);
  });

  it('should not revoke invalid token', async () => {
    const token = {
      refreshToken: 'oauth-refresh-token',
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      client: {
        id: 'oauth_client_2',
      },
    };
    const result = await oauthManager.revokeToken(token);
    expect(result).to.eq(false);
  });
});
