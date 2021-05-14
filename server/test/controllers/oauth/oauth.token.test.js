const request = require('supertest');
const { expect } = require('chai');

describe('POST /oauth/token', () => {
  it('should call token', async () => {
    const body = {
      grant: 'authorization_code',
      code: 'd71204f44',
      client_id: 'oauth_client_1',
      client_secret: 'this_is_secret_for_oauth_client_1',
      redirect_uri: 'http://oauth1.fr',
    };

    await request(TEST_BACKEND_APP)
      .post(`/api/v1/oauth/token`)
      .send(`grant_type=${body.grant}`)
      .send(`code=${body.code}`)
      .send(`client_id=${body.client_id}`)
      .send(`client_secret=${body.client_secret}`)
      .send(`redirect_uri=${body.redirect_uri}`)
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
