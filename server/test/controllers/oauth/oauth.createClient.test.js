const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('POST /oauth', () => {
  it('should create client', async () => {
    await authenticatedRequest
      .post('/api/v1/oauth')
      .send({
        client_id: 'new_oauth_client_form_request',
        redirect_uris: ['uri_1', 'uri_2'],
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('client_secret');
      });
  });

  it('should fail on client creation', async () => {
    await authenticatedRequest
      .post('/api/v1/oauth')
      .send({
        client_id: 'oauth_client_1',
        redirect_uris: ['uri_1', 'uri_2'],
      })
      .expect('Content-Type', /json/)
      .expect(409);
  });
});
