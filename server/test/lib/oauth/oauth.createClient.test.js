const { expect, assert } = require('chai');
const OauthManager = require('../../../lib/oauth');

describe('oauth.createClient', () => {
  const oauthManager = new OauthManager({}, {});

  it('should create OAuth client and generate secret', async () => {
    const clientToCreate = {
      id: 'new_oauth_client_1',
      name: 'client name',
      redirect_uris: ['uri_1', 'uri_2'],
    };

    const client = await oauthManager.createClient(clientToCreate);

    expect(client).to.deep.include(clientToCreate);
    expect(client.secret).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should create OAuth client and generate secret, no redirect_uris', async () => {
    const clientToCreate = {
      id: 'new_oauth_client_2',
      name: 'client name',
    };

    const client = await oauthManager.createClient(clientToCreate);

    expect(client).to.deep.include(clientToCreate);
    expect(client.secret).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should not create already existing OAuth client', async () => {
    const clientToCreate = {
      id: 'oauth_client_1',
      name: 'client name',
      redirect_uris: ['uri_1', 'uri_2'],
    };

    try {
      await oauthManager.createClient(clientToCreate);
      assert.fail(undefined, undefined, 'OAuth to create already exists and should have fail');
    } catch (e) {
      expect(e.original.errno).to.eq(19);
    }
  });
});
