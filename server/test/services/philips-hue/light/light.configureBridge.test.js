const { assert, expect } = require('chai');
const { fake } = require('sinon');
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const { MockedPhilipsHueClient } = require('../mocks.test');

const PhilipsHueService = proxyquire('../../../../services/philips-hue/index', {
  'node-hue-api': MockedPhilipsHueClient,
});

const StateManager = require('../../../../lib/state');
const ServiceManager = require('../../../../lib/service');
const DeviceManager = require('../../../../lib/device');
const Job = require('../../../../lib/job');

const event = new EventEmitter();
const stateManager = new StateManager(event);
const job = new Job(event);
const serviceManager = new ServiceManager({}, stateManager);
const brain = {
  addNamedEntity: fake.returns(null),
};
const deviceManager = new DeviceManager(event, {}, stateManager, serviceManager, {}, {}, job, brain);

const gladys = {
  device: deviceManager,
};

describe('PhilipsHueService', () => {
  it('should configure bridge', async () => {
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await philipsHueService.device.getBridges();
    const device = await philipsHueService.device.configureBridge('192.168.1.10');
    expect(device).to.have.property('name', 'Philips Hue Bridge');
    expect(device).to.have.property('selector', 'philips-hue-bridge-1234');
    expect(device).to.have.property('external_id', 'philips-hue:bridge:1234');
    expect(device).to.have.property('features');
    expect(device).to.have.property('params');
    expect(device.params[0]).to.have.property('name', 'BRIDGE_IP_ADDRESS');
    expect(device.params[0]).to.have.property('value', '192.168.1.10');
    expect(device.params[1]).to.have.property('name', 'BRIDGE_USERNAME');
    expect(device.params[1]).to.have.property('value', 'username');
    expect(device.params[2]).to.have.property('name', 'BRIDGE_SERIAL_NUMBER');
    expect(device.params[2]).to.have.property('value', '1234');
  });
  it('should not configure bridge', async () => {
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    const promise = philipsHueService.device.configureBridge('1234');
    return assert.isRejected(promise);
  });
});
