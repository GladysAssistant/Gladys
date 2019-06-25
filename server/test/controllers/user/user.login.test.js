const { expect } = require('chai');
const { request } = require('../request.test');

describe('POST /api/v1/login', () => {
  it('should login user', async () => {
    await request
      .post('/api/v1/login')
      .send({
        email: 'demo@demo.com',
        password: 'mysuperpassword',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          id: '0cd30aef-9c4e-4a23-88e3-3547971296e5',
          firstname: 'John',
          lastname: 'Doe',
          email: 'demo@demo.com',
          language: 'en',
          birthdate: '12/12/1990',
          role: 'admin',
          created_at: '2019-02-12T07:49:07.556Z',
          updated_at: '2019-02-12T07:49:07.556Z',
          refresh_token: res.body.refresh_token,
          access_token: res.body.access_token,
          session_id: res.body.session_id,
        });
      });
  });
  it('should not login user (email not found)', async () => {
    await request
      .post('/api/v1/login')
      .send({
        email: 'usernotfound@demo.com',
        password: 'wrong',
      })
      .expect('Content-Type', /json/)
      .expect(404);
  });
  it('should not login user (wrong password)', async () => {
    await request
      .post('/api/v1/login')
      .send({
        email: 'demo@demo.com',
        password: 'wrong',
      })
      .expect('Content-Type', /json/)
      .expect(403);
  });
});
