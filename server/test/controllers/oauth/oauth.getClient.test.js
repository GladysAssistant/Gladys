const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('GET /oauth', () => {
  it('should get all clients', async () => {
    await authenticatedRequest
      .get('/api/v1/oauth')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.eq([
          {
            client_id: 'oauth_client_1',
            client_secret: 'this_is_secret_for_oauth_client_1',
            redirect_uris: ['http://oauth1.fr', 'http://oauth1.com'],
            grants: ['grant_1', 'grant_2'],
            created_at: '2019-02-12T07:49:07.556Z',
            updated_at: '2019-02-12T07:49:07.556Z',
          },
          {
            client_id: 'oauth_client_2',
            client_secret: 'this_is_secret_for_oauth_client_2',
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
      .get('/api/v1/oauth/oauth_client_1')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.include({
          client_id: 'oauth_client_1',
          client_secret: 'this_is_secret_for_oauth_client_1',
          redirect_uris: ['http://oauth1.fr', 'http://oauth1.com'],
          grants: ['grant_1', 'grant_2'],
        });
      });
  });

  it('should get no client', async () => {
    await authenticatedRequest
      .get('/api/v1/oauth/oauth_client_123')
      .expect('Content-Type', /json/)
      .expect(404);
  });
});
