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
      id: 'oauth_client_1',
    });

    expect(authorizationCode).to.have.property('user');
    expect(authorizationCode.user).to.deep.include({
      id: '7a137a56-069e-4996-8816-36558174b727',
    });
  });

  it('should get invalid AuthorizationCode', async () => {
    const authorizationCode = await oauthManager.getAuthorizationCode('unknown');
    expect(authorizationCode).to.eq(null);
  });
});
