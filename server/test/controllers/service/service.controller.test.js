const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');

describe('POST /api/v1/service/:service_name/start', () => {
  it('should start a service', async () => {
    await authenticatedRequest
      .post('/api/v1/service/test-service/start')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('name', 'test-service');
      });
  });

  it('should fail on unknwon service', async () => {
    await authenticatedRequest
      .post('/api/v1/service/example/start')
      .expect('Content-Type', /json/)
      .expect(404);
  });
});

describe('POST /api/v1/service/:service_name/stop', () => {
  it('should stop a service', async () => {
    await authenticatedRequest
      .post('/api/v1/service/test-service/stop')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('name', 'test-service');
      });
  });

  it('should fail on unknwon service', async () => {
    await authenticatedRequest
      .post('/api/v1/service/example/stop')
      .expect('Content-Type', /json/)
      .expect(404);
  });
});

describe('GET /api/v1/service/:service_name', () => {
  it('should get a service by name', async () => {
    await authenticatedRequest
      .get('/api/v1/service/test-service')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.have.property('name', 'test-service');
      });
  });
});

describe('GET /api/v1/service', () => {
  it('should get all services', async () => {
    await authenticatedRequest
      .get('/api/v1/service')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body[0]).to.have.property('name', 'test-service');
      });
  });
});
