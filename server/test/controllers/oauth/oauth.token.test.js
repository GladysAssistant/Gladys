const request = require('supertest');
const { expect } = require('chai');

describe('POST /oauth/token', () => {
  it('should call token', async () => {
    const body = {
      grant: 'authorization_code',
      code: 'd71204f44',
      client_id: 'oauth_client_2',
      client_secret: 'this_is_secret_for_oauth_client_2',
      redirect_uri: 'http://oauth2.fr',
    };

    await request(TEST_BACKEND_APP)
      .post(`/api/v1/oauth/token`)
      .send(
        `grant_type=${body.grant}&code=${body.code}&client_id=${body.client_id}&client_secret=${
          body.client_secret
        }&redirect_uri=${body.redirect_uri}`,
      )
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res).to.have.property('body');
      });
  });

  it('should call token, but fail on missing parameters', async () => {
    await request(TEST_BACKEND_APP)
      .post(`/api/v1/oauth/token`)
      .send('parameter=invalid')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(400);
  });
});
