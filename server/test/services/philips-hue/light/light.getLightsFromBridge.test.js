const { expect } = require('chai');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const PhilipsHueClient = require('../mocks.test');

const PhilipsHueService = proxyquire('../../../../services/philips-hue/index', {
  'node-hue-api': PhilipsHueClient,
});

const StateManager = require('../../../../lib/state');
const DeviceManager = require('../../../../lib/device');

const event = new EventEmitter();
const stateManager = new StateManager(event);
const deviceManager = new DeviceManager(event, {}, stateManager, {});

const gladys = {
  device: deviceManager,
  stateManager,
};

describe('PhilipsHueService', () => {
  const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
  stateManager.setState('system', 'SYSTEM_LANGUAGE', 'en');
  it('should get lights from bridge', async () => {
    await philipsHueService.light.configureBridge('Bridge', '192.168.1.1');
    const lights = await philipsHueService.light.getLightsFromBridge();
    lights.forEach((light) => {
      expect(light).to.have.property('id');
      expect(light).to.have.property('name');
      expect(light).to.have.property('selector');
      expect(light).to.have.property('features');
      expect(light).to.have.property('params');
      expect(light.features).to.have.lengthOf(4);
      light.features.forEach((feature) => {
        expect(feature).to.have.property('name');
      });
    });
  });
});
