const { expect } = require('chai');
const { request } = require('../request.test');

describe('GET /api/v1/setup', () => {
  it('should return if the account is confifured or not', async () => {
    await request
      .get('/api/v1/setup')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('account_configured', true);
      });
  });
});
