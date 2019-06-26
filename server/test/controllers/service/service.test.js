const { expect } = require('chai');
const { authenticatedRequest } = require('../request.test');
const { ACTIONS, ACTIONS_STATUS } = require('../../../utils/constants');

describe('POST /api/v1/service/:service_name/start', () => {
  it('should start a service', async () => {
    await authenticatedRequest
      .post('/api/v1/service/example/start')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          type: ACTIONS.SERVICE.START,
          service: 'example',
          status: ACTIONS_STATUS.PENDING,
        });
      });
  });
});

describe('POST /api/v1/service/:service_name/stop', () => {
  it('should stop a service', async () => {
    await authenticatedRequest
      .post('/api/v1/service/example/stop')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          type: ACTIONS.SERVICE.STOP,
          service: 'example',
          status: ACTIONS_STATUS.PENDING,
        });
      });
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
