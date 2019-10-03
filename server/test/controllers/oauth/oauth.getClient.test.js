const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('GET /oauth/client', () => {
  it('should get all clients', async () => {
    await authenticatedRequest
      .get('/api/v1/oauth/client')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.eq([
          {
            id: 'oauth_client_1',
            secret: 'this_is_secret_for_oauth_client_1',
            name: 'OAuth client 1',
            redirectUris: ['http://oauth1.fr', 'http://oauth1.com'],
            redirect_uris: ['http://oauth1.fr', 'http://oauth1.com'],
            grants: ['authorization_code', 'grant_2'],
            created_at: '2019-02-12T07:49:07.556Z',
            updated_at: '2019-02-12T07:49:07.556Z',
          },
          {
            id: 'oauth_client_2',
            secret: 'this_is_secret_for_oauth_client_2',
            name: 'OAuth client 2',
            redirectUris: ['http://oauth2.fr'],
            redirect_uris: ['http://oauth2.fr'],
            grants: [],
            created_at: '2019-02-12T07:49:07.556Z',
            updated_at: '2019-02-12T07:49:07.556Z',
          },
        ]);
      });
  });
});

describe('GET /oauth/:client_id', () => {
  it('should get client', async () => {
    await authenticatedRequest
      .get('/api/v1/oauth/client/oauth_client_1')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.include({
          id: 'oauth_client_1',
          name: 'OAuth client 1',
          secret: 'this_is_secret_for_oauth_client_1',
          redirect_uris: ['http://oauth1.fr', 'http://oauth1.com'],
          grants: ['authorization_code', 'grant_2'],
        });
      });
  });

  it('should get client no grant', async () => {
    await authenticatedRequest
      .get('/api/v1/oauth/client/oauth_client_2')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.include({
          id: 'oauth_client_2',
          name: 'OAuth client 2',
          secret: 'this_is_secret_for_oauth_client_2',
          redirect_uris: ['http://oauth2.fr'],
          grants: [],
        });
      });
  });

  it('should get no client', async () => {
    await authenticatedRequest
      .get('/api/v1/oauth/client/oauth_client_123')
      .expect('Content-Type', /json/)
      .expect(404);
  });
});
