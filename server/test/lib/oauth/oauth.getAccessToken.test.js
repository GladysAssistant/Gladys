const { expect } = require('chai');
const OauthManager = require('../../../lib/oauth');

describe('oauth.getAccessToken', () => {
  const oauthManager = new OauthManager({}, {});

  it('should get OAuth access token', async () => {
    const accessToken = await oauthManager.getAccessToken('oauth-access-token');
    expect(accessToken).to.deep.include({
      accessToken: 'oauth-access-token',
      client: {
        id: 'oauth_client_1',
      },
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
    });
    expect(accessToken).to.have('accessTokenExpiresAt');
    expect(accessToken).to.have('scope');
  });

  it('should get no OAuth access token', async () => {
    const accessToken = await oauthManager.getAccessToken('oauth_access_token_unkown');
    expect(accessToken).to.eq(null);
  });
});
