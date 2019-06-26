const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('POST /api/v1/user/:user_selector/location', () => {
  it('should save user location', async () => {
    await authenticatedRequest
      .post('/api/v1/user/john/location')
      .send({
        latitude: 12,
        longitude: 12,
      })
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.have.property('latitude', 12);
        expect(res.body).to.have.property('longitude', 12);
        expect(res.body).to.have.property('user_id', '0cd30aef-9c4e-4a23-88e3-3547971296e5');
      });
  });
});

describe('GET /api/v1/user/:user_selector/location', () => {
  it('should return history of location', async () => {
    await authenticatedRequest
      .get('/api/v1/user/john/location')
      .query({
        from: '2018-04-02 04:41:09',
        to: '2019-04-02 04:41:09',
      })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        res.body.forEach((location) => {
          expect(location).to.have.property('latitude');
          expect(location).to.have.property('longitude');
          expect(location).to.have.property('user_id', '0cd30aef-9c4e-4a23-88e3-3547971296e5');
        });
      });
  });
});
