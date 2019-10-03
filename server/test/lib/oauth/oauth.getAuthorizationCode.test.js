const { expect } = require('chai');
const OauthManager = require('../../../lib/oauth');
const UserManager = require('../../../lib/user');

describe('oauth.getAuthorizationCode', () => {
  const oauthManager = new OauthManager(new UserManager(), {});

  it('should get AuthorizationCode', async () => {
    const authorizationCode = await oauthManager.getAuthorizationCode('d71204f44');

    expect(authorizationCode).to.have.property('code', 'd71204f44');
    expect(authorizationCode).to.have.property('expiresAt');
    expect(authorizationCode).to.have.property('redirectUri', 'http://oauth1.fr');

    expect(authorizationCode).to.have.property('client');
    expect(authorizationCode.client).to.deep.include({
      id: 'oauth_client_2',
    });

    expect(authorizationCode).to.have.property('user');
    expect(authorizationCode.user).to.deep.include({
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
  });

  it('should get invalid AuthorizationCode', async () => {
    const authorizationCode = await oauthManager.getAuthorizationCode('unknown');
    expect(authorizationCode).to.eq(null);
  });
});
