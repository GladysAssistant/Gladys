const { assert, fake } = require('sinon');
const MiLightControllers = require('../../../../services/mi-light/api/milight.controller');

const miLightLightService = {
  configureBridge: fake.resolves({}),
};

const res = {
  json: fake.returns(null),
};

describe('POST /service/mi-light/bridge/configure', () => {
  it('should configure bridge', async () => {
    const miLightController = MiLightControllers(miLightLightService);
    const req = {
      body: {
        mac: '00:1B:44:11:3A:B7',
      },
    };
    await miLightController['post /api/v1/service/mi-light/bridge/configure'].controller(req, res);
    assert.calledWith(miLightLightService.configureBridge, '00:1B:44:11:3A:B7');
  });
});
