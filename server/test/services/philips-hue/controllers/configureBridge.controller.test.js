const { assert, fake } = require('sinon');
const PhilipsHueControllers = require('../../../../services/philips-hue/api/hue.controller');

const philipsHueLightService = {
  configureBridge: fake.resolves({}),
};

const res = {
  json: fake.returns(null),
};

describe('POST /service/philips-hue/bridge/configure', () => {
  it('should configure bridge', async () => {
    const philipsHueController = PhilipsHueControllers(philipsHueLightService);
    const req = {
      body: {
        ipAddress: '192.168.1.10',
      },
    };
    await philipsHueController['post /api/v1/service/philips-hue/bridge/configure'].controller(req, res);
    assert.calledWith(philipsHueLightService.configureBridge, '192.168.1.10');
  });
});
