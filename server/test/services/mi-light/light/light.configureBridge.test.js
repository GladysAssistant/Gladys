const { assert, expect } = require('chai');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const milightClient = require('../mocks.test');

const MiLightService = proxyquire('../../../../services/mi-light/index', {
  'node-milight-promise': milightClient,
});

const StateManager = require('../../../../lib/state');
const DeviceManager = require('../../../../lib/device');

const event = new EventEmitter();
const stateManager = new StateManager(event);
const deviceManager = new DeviceManager(event, {}, stateManager, {});

const gladys = {
  device: deviceManager,
};

describe('MiLightService', () => {
  it('should configure bridge', async () => {
    const miLightService = MiLightService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await miLightService.device.getBridges();
    const device = await miLightService.device.configureBridge('00:1b:44:11:3a:b7');
    expect(device).to.have.property('name', 'Mi Light Bridge');
    expect(device).to.have.property('selector', 'mi-light-bridge-001b44113ab7');
    expect(device).to.have.property('external_id', 'mi-light:bridge:001b44113ab7');
    expect(device).to.have.property('features');
    expect(device).to.have.property('params');
    expect(device.params[0]).to.have.property('name', 'BRIDGE_IP_ADDRESS');
    expect(device.params[0]).to.have.property('value', '192.168.10.245');
    expect(device.params[1]).to.have.property('name', 'BRIDGE_TYPE');
    expect(device.params[1]).to.have.property('value', 'v6');
    expect(device.params[2]).to.have.property('name', 'BRIDGE_MAC');
    expect(device.params[2]).to.have.property('value', '00:1b:44:11:3a:b7');
    expect(device.params[3]).to.have.property('name', 'BRIDGE_NAME');
    expect(device.params[3]).to.have.property('value', 'Mi Light Bridge');
  });
  it('should not configure bridge', async () => {
    const miLightService = MiLightService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const promise = miLightService.device.configureBridge('00:1b:44:11:3a:b7');
    return assert.isRejected(promise);
  });
});
