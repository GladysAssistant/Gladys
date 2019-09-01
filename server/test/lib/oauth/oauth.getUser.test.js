const { expect } = require('chai');
const OauthManager = require('../../../lib/oauth');
const UserManager = require('../../../lib/user');

describe('oauth.getUser', () => {
  const oauthManager = new OauthManager(new UserManager());

  it('should get John Doe user', async () => {
    const accessToken = await oauthManager.getUser('demo@demo.com', 'mysuperpassword');
    expect(accessToken).to.deep.eq({
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      firstname: 'John',
      lastname: 'Doe',
      language: 'en',
      role: 'admin',
      email: 'demo@demo.com',
      birthdate: '12/12/1990',
      created_at: new Date('2019-02-12T07:49:07.556Z'),
      updated_at: new Date('2019-02-12T07:49:07.556Z'),
    });
  });

  it('should get no user', async () => {
    const accessToken = await oauthManager.getUser('unknown@gladys.com', 'mysuperpassword');
    expect(accessToken).to.eq(false);
  });
});
