const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

const basePayload = {
  contract: 'base',
  price_type: 'consumption',
  currency: 'euro',
  price: 20,
};

const makePayload = (overrides = {}) => ({
  ...basePayload,
  // use distinct dates to avoid selector collisions
  start_date: overrides.start_date || new Date(Date.now() - Math.floor(Math.random() * 1e7)).toISOString().slice(0, 10),
  ...overrides,
});

describe('GET /api/v1/energy_price', () => {
  it('should list energy prices', async () => {
    await authenticatedRequest
      .get('/api/v1/energy_price')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.instanceOf(Array);
      });
  });
});

describe('POST /api/v1/energy_price', () => {
  it('should create energy price', async () => {
    const payload = makePayload();
    await authenticatedRequest
      .post('/api/v1/energy_price')
      .send(payload)
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => {
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('selector');
        expect(res.body).to.have.property('contract', payload.contract);
        expect(res.body).to.have.property('price', payload.price);
      });
  });
});

describe('PATCH /api/v1/energy_price/:selector', () => {
  it('should update an energy price by selector', async () => {
    // First create
    const payload = makePayload();
    const created = await authenticatedRequest
      .post('/api/v1/energy_price')
      .send(payload)
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => res.body);

    // Then update
    await authenticatedRequest
      .patch(`/api/v1/energy_price/${created.selector}`)
      .send({ price: 42 })
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('selector', created.selector);
        expect(res.body).to.have.property('price', 42);
      });
  });
});

describe('DELETE /api/v1/energy_price/:selector', () => {
  it('should delete an energy price by selector', async () => {
    // First create
    const payload = makePayload();
    const created = await authenticatedRequest
      .post('/api/v1/energy_price')
      .send(payload)
      .expect('Content-Type', /json/)
      .expect(201)
      .then((res) => res.body);

    // Then delete
    await authenticatedRequest
      .delete(`/api/v1/energy_price/${created.selector}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({ success: true });
      });
  });
});
