const { expect } = require('chai');
const OauthManager = require('../../../lib/oauth');

describe('oauth.getAccessToken', () => {
  const oauthManager = new OauthManager({}, {});

  it('should get OAuth access token', async () => {
    const accessToken = await oauthManager.getAccessToken('oauth-access-token');
    expect(accessToken).to.have.property('accessToken', 'oauth-access-token');
    expect(accessToken).to.have.property('accessTokenExpiresAt');
    expect(accessToken).to.have.property('scope');

    expect(accessToken).to.have.property('client');
    expect(accessToken.client).to.deep.include({
      id: 'oauth_client_1',
    });

    expect(accessToken).to.have.property('user');
    expect(accessToken.user).to.deep.include({
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
  });

  it('should get no OAuth access token', async () => {
    const accessToken = await oauthManager.getAccessToken('oauth_access_token_unkown');
    expect(accessToken).to.eq(null);
  });
});
