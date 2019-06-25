const { assert, fake } = require('sinon');
const PhilipsHueControllers = require('../../../../services/philips-hue/api/hue.controller');

const bridge = {
  name: 'Philips hue',
  ipaddress: '192.168.2.245',
};

const philipsHueLightService = {
  configureBridge: fake.resolves(null),
};

const res = {
  json: fake.returns(null),
};

describe('POST /service/philips-hue/bridge/configure', () => {
  it('should configure bridge', async () => {
    const philipsHueController = PhilipsHueControllers(philipsHueLightService);
    const req = {
      body: bridge,
    };
    await philipsHueController['post /api/v1/service/philips-hue/bridge/configure'].controller(req, res);
    assert.calledWith(philipsHueLightService.configureBridge, bridge.name, bridge.ipaddress);
    assert.calledWith(res.json, { success: true });
  });
});
