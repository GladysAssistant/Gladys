const { expect } = require('chai');
const OauthManager = require('../../../lib/oauth');

describe('oauth.getRefreshToken', () => {
  const oauthManager = new OauthManager({}, {});

  it('should get OAuth refresh token', async () => {
    const refreshToken = await oauthManager.getRefreshToken('oauth-refresh-token');
    expect(refreshToken).to.deep.include({
      refreshToken: 'oauth-refresh-token',
      client: {
        id: 'oauth_client_1',
      },
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
    });
    expect(refreshToken).to.have('refreshTokenExpiresAt');
    expect(refreshToken).to.have('scope');
  });

  it('should get no OAuth refresh token', async () => {
    const refreshToken = await oauthManager.getRefreshToken('oauth_refresh_token_unkown');
    expect(refreshToken).to.eq(null);
  });
});
