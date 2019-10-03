const { expect } = require('chai');
const OauthManager = require('../../../lib/oauth');
const UserManager = require('../../../lib/user');

describe('oauth.getUserFromClient', () => {
  const oauthManager = new OauthManager(new UserManager(), {});

  it('should get user from id', async () => {
    const user = oauthManager.getUserFromClient({ user_id: '0cd30aef-9c4e-4a23-88e3-3547971296e5' });
    expect(user).to.not.eq(null);
  });
});
