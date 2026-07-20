const { assert, fake } = require('sinon');
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
  afterEach(() => {
    hueApi.syncWithBridge.resetHistory();
  });

  it('should sync bridge when a light is created', async () => {
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await philipsHueService.device.getBridges();
    await philipsHueService.device.configureBridge('192.168.1.10');

    await philipsHueService.device.postCreate({
      model: 'LCT015',
      external_id: 'philips-hue-light:1234:5',
    });

    assert.calledOnce(hueApi.syncWithBridge);
  });

  it('should not sync bridge when a bridge is created', async () => {
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await philipsHueService.device.getBridges();
    await philipsHueService.device.configureBridge('192.168.1.10');
    hueApi.syncWithBridge.resetHistory();

    await philipsHueService.device.postCreate({
      model: 'philips-hue-bridge',
      external_id: 'philips-hue:bridge:1234',
    });

    assert.notCalled(hueApi.syncWithBridge);
  });

  it('should not sync bridge when external id is not a light', async () => {
    const philipsHueService = PhilipsHueService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');
    await philipsHueService.device.getBridges();
    await philipsHueService.device.configureBridge('192.168.1.10');
    hueApi.syncWithBridge.resetHistory();

    await philipsHueService.device.postCreate({
      model: 'LCT015',
      external_id: 'unknown-format:1234:5',
    });

    assert.notCalled(hueApi.syncWithBridge);
  });
});
