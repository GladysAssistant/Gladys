const { expect } = require('chai');
const OauthManager = require('../../../lib/oauth');

describe('oauth.getRefreshToken', () => {
  const oauthManager = new OauthManager();

  it('should get OAuth access token', async () => {
    const accessToken = await oauthManager.getRefreshToken('refresh_token_1');
    expect(accessToken).to.deep.include({
      id: '0cd30aef-9c4e-4a23-88e3-354797129001',
      access_token: 'oauth_token_1',
      access_token_expires_on: new Date('2019-08-12 07:49:07.556 +00:00'),
      refresh_token: 'refresh_token_1',
      refresh_token_expires_on: new Date('2019-08-12 17:49:07.556 +00:00'),
      user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
  });

  it('should get no OAuth access token', async () => {
    const accessToken = await oauthManager.getRefreshToken('oauth_refresh_token_unkown');
    expect(accessToken).to.eq(null);
  });
});
