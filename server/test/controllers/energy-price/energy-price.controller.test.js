const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('energy_price API (read-only compatibility window)', () => {
  it('should list the legacy prices projected from the contracts', async () => {
    await authenticatedRequest
      .get('/api/v1/energy_price')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
      });
  });
  it('should answer 410 on every write', async () => {
    await authenticatedRequest
      .post('/api/v1/energy_price')
      .send({ contract: 'base', price: 20 })
      .expect(410)
      .then((res) => {
        expect(res.body.code).to.equal('GONE');
        expect(res.body.message).to.contain('/api/v1/energy_contract');
      });
    await authenticatedRequest
      .patch('/api/v1/energy_price/some-selector')
      .send({ price: 42 })
      .expect(410);
    await authenticatedRequest.delete('/api/v1/energy_price/some-selector').expect(410);
  });
  it('should return the default electric meter feature id', async () => {
    await authenticatedRequest
      .get('/api/v1/energy_price/default_electric_meter_feature_id')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('feature_id');
        expect(res.body.feature_id).to.equal(null);
      });
  });
});
