const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('GET /oauth/authorize', () => {
  it('should call authorize', async () => {
    const clientId = 'oauth_client_1';
    const redirectUri = 'http://oauth1.fr';
    const state = 'state_code';

    await authenticatedRequest
      .get(
        `/api/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`,
      )
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('uri');

        expect(res.body.uri).to.match(/^http:\/\/oauth1\.fr\/\?code=[a-z0-9]+&state=state_code$/);

        expect(res.body).to.have.property('headers');
      });
  });

  it('should call authorize, but fail on unknown client', async () => {
    const clientId = 'oauth_client_4';
    const redirectUri = 'http://oauth1.fr';
    const state = 'state_code';

    await authenticatedRequest
      .get(
        `/api/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&state=${state}`,
      )
      .expect('Content-Type', /json/)
      .expect(500);
  });
});
