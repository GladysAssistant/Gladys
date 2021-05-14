const { expect } = require('chai');
const { Cache } = require('../../../utils/cache');
const OauthManager = require('../../../lib/oauth');
const UserManager = require('../../../lib/user');
const SessionManager = require('../../../lib/session');
const { generateAccessToken } = require('../../../utils/accessToken');

describe('oauth.getAccessToken', () => {
  const cache = new Cache();
  const oauthManager = new OauthManager(new UserManager(), new SessionManager('secret', cache));

  it('should get OAuth access token', async () => {
    const token = generateAccessToken(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      ['dashboard:read', 'reset-password:write'],
      '1ec7c3d5-f806-4920-97b3-3e75e19b6434',
      'secret',
    );
    const accessToken = await oauthManager.getAccessToken(token);
    expect(accessToken).to.have.property('accessToken');
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

  it('should get OAuth access token without client', async () => {
    const token = generateAccessToken(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      ['dashboard:read', 'reset-password:write'],
      'ada07710-5f25-4510-ac63-b002aca3bd32',
      'secret',
    );
    const accessToken = await oauthManager.getAccessToken(token);
    expect(accessToken).to.have.property('accessToken');
    expect(accessToken).to.have.property('accessTokenExpiresAt');
    expect(accessToken).to.have.property('scope');

    expect(accessToken).to.have.property('client', undefined);

    expect(accessToken).to.have.property('user');
    expect(accessToken.user).to.deep.include({
      id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
    });
  });

  it('should get OAuth access token without existing session', async () => {
    const token = generateAccessToken(
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      ['dashboard:read', 'reset-password:write'],
      '0cd30aef-9c4e-4a23-88e3-3547971296e5',
      'secret',
    );
    const accessToken = await oauthManager.getAccessToken(token);
    expect(accessToken).to.eq(null);
  });
});
