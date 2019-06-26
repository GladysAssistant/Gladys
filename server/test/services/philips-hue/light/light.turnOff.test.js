const { assert, fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const PhilipsHueClient = require('../mocks.test');
const { STATE_OFF } = require('../mocks.test');

const PhilipsHueService = proxyquire('../../../../services/philips-hue/index', {
  'node-hue-api': PhilipsHueClient,
});

const device = {
  external_id: 'philips-hue:1',
};

describe('PhilipsHueService.turnOff', () => {
  const philipsHueService = PhilipsHueService();
  philipsHueService.light.hueApi = {
    setLightState: fake.resolves(null),
  };
  it('should turn off the light', async () => {
    await philipsHueService.light.turnOff(device);
    assert.calledWith(philipsHueService.light.hueApi.setLightState, 1, STATE_OFF);
  });
});
