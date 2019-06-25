const { expect } = require('chai');
const { request, authenticatedRequest } = require('../request.test');
const { ACTIONS, ACTIONS_STATUS } = require('../../../utils/constants');

describe('POST /api/v1/light/:device_selector/on', () => {
  it('should turn on the light', async () => {
    await authenticatedRequest
      .post('/api/v1/light/test-device/on')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.deep.equal({
          type: ACTIONS.LIGHT.TURN_ON,
          device: 'test-device',
          status: ACTIONS_STATUS.PENDING,
        });
      });
  });
  it('should return 401 unauthorized', async () => {
    await request
      .post('/api/v1/light/test-device/on')
      .expect('Content-Type', /json/)
      .expect(401);
  });
});
