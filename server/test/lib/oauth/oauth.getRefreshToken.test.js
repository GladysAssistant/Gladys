const { expect } = require('chai');
const OauthManager = require('../../../lib/oauth');

describe('oauth.getRefreshToken', () => {
  const oauthManager = new OauthManager({}, {});

  it('should get OAuth refresh token', async () => {
    const refreshToken = await oauthManager.getRefreshToken('oauth-refresh-token');
    expect(refreshToken).to.have.property('refreshToken', 'oauth-refresh-token');
    expect(refreshToken).to.have.property('refreshTokenExpiresAt');
    expect(refreshToken).to.have.property('scope');

    expect(refreshToken).to.have.property('client');
    expect(refreshToken.client).to.deep.include({
      id: 'oauth_client_1',
    });

    expect(refreshToken).to.have.property('user');
    expect(refreshToken.user).to.deep.include({
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
  });

  it('should get no OAuth refresh token', async () => {
    const refreshToken = await oauthManager.getRefreshToken('oauth_refresh_token_unkown');
    expect(refreshToken).to.eq(null);
  });
});
