const { expect } = require('chai');
const OauthManager = require('../../../lib/oauth');

describe('oauth.getClient', () => {
  const oauthManager = new OauthManager({}, {});

  it('should get OAuth client', async () => {
    const client = await oauthManager.getClient('oauth_client_1', undefined);
    expect(client).to.deep.include({
      id: 'oauth_client_1',
      name: 'OAuth client 1',
      secret: 'this_is_secret_for_oauth_client_1',
      redirect_uris: ['http://oauth1.fr', 'http://oauth1.com'],
      grants: ['authorization_code', 'grant_2'],
    });
  });

  it('should get OAuth client with secret', async () => {
    const client = await oauthManager.getClient('oauth_client_1', 'this_is_secret_for_oauth_client_1');
    expect(client).to.deep.include({
      id: 'oauth_client_1',
      name: 'OAuth client 1',
      secret: 'this_is_secret_for_oauth_client_1',
      redirect_uris: ['http://oauth1.fr', 'http://oauth1.com'],
      grants: ['authorization_code', 'grant_2'],
    });
  });

  it('should get no OAuth client', async () => {
    const client = await oauthManager.getClient('oauth_client_unkown', undefined);
    expect(client).to.eq(null);
  });

  it('should get no OAuth client with invalid secret', async () => {
    const client = await oauthManager.getClient('oauth_client_1', 'invalid_secret');
    expect(client).to.eq(null);
  });
});
