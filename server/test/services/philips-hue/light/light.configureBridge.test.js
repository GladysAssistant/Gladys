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
};

describe('PhilipsHueService', () => {
  const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
  it('should configure bridge', async () => {
    const device = await philipsHueService.light.configureBridge('Bridge', '192.168.1.1');
    expect(device).to.have.property('name', 'Bridge');
    expect(device).to.have.property('selector', 'bridge');
    expect(device).to.have.property('features');
    expect(device).to.have.property('params');
    expect(device.params[0]).to.have.property('name', 'BRIDGE_IP_ADDRESS');
    expect(device.params[0]).to.have.property('value', '192.168.1.1');
    expect(device.params[1]).to.have.property('name', 'BRIDGE_USER_ID');
    expect(device.params[1]).to.have.property('value', 'PHILIPS_HUE_USER_ID_TEST');
  });
});
