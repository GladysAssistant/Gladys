const { assert, fake } = require('sinon');
const PhilipsHueControllers = require('../../../../services/philips-hue/api/hue.controller');

const philipsHueLightService = {
  syncWithBridge: fake.resolves({}),
};

const res = {
  json: fake.returns(null),
};

describe('POST /service/philips-hue/bridge/sync', () => {
  it('should sync bridge', async () => {
    const philipsHueController = PhilipsHueControllers(philipsHueLightService);
    const req = {};
    await philipsHueController['post /api/v1/service/philips-hue/bridge/sync'].controller(req, res);
    assert.called(philipsHueLightService.syncWithBridge);
  });
});
