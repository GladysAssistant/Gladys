const { assert, fake } = require('sinon');
const chaiAssert = require('chai').assert;
const EventEmitter = require('events');
const proxyquire = require('proxyquire').noCallThru();
const { MockedPhilipsHueClient, hueApi } = require('../mocks.test');

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
  it('should sync with bridge', async () => {
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await philipsHueService.device.getBridges();
    await philipsHueService.device.configureBridge('192.168.1.10');
    await philipsHueService.device.syncWithBridge();
    assert.called(hueApi.syncWithBridge);
  });
  it('should reject (error with Api not found)', async () => {
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await philipsHueService.device.getBridges();
    await philipsHueService.device.configureBridge('192.168.1.10');
    philipsHueService.device.hueApisBySerialNumber = new Map();
    const promise = philipsHueService.device.syncWithBridge();
    return chaiAssert.isRejected(promise);
  });
});
