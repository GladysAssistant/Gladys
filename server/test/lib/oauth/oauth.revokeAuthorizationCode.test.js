const { expect } = require('chai');
const OauthManager = require('../../../lib/oauth');
const UserManager = require('../../../lib/user');

describe('oauth.revokeAuthorizationCode', () => {
  const oauthManager = new OauthManager(new UserManager(), {});

  it('should revoke AuthorizationCode', async () => {
    const authCode = {
      code: 'd71204f44',
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      client: {
        id: 'oauth_client_2',
      },
    };
    const result = await oauthManager.revokeAuthorizationCode(authCode);
    expect(result).to.eq(true);
  });

  it('should not revoke invalid AuthorizationCode', async () => {
    const authCode = {
      code: 'invalid_code',
      user: {
        id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      },
      client: {
        id: 'oauth_client_1',
      },
    };
    const result = await oauthManager.revokeAuthorizationCode(authCode);
    expect(result).to.eq(false);
  });
});
