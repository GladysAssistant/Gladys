const { fake, stub, assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const EventEmitter = require('events');
const TpLinkApiClient = require('../mocks.test');
const devices = require('../devices.json');

const TpLinkService = proxyquire('../../../../services/tp-link/index', {
  'tplink-smarthome-api': TpLinkApiClient,
});

const StateManager = require('../../../../lib/state');

const event = new EventEmitter();
const eventTpLink = new EventEmitter();
const stateManager = new StateManager(event);
const deviceManager = {
  get: fake.resolves(devices),
};

const gladys = {
  device: deviceManager,
  stateManager,
  event,
};

const tpLinkService = TpLinkService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');

describe('TpLinkService GetDevices', () => {
  it('should start discovery', async () => {
    // PREPARE
    stub(tpLinkService.device.client, 'startDiscovery').callsFake(() => {
      return eventTpLink;
    });
    // EXECUTE
    const promise = tpLinkService.device.getDevices();
    eventTpLink.emit('device-online', {
      getSysInfo: fake.resolves({
        deviceId: 1,
        type: 'IOT.SMARTPLUGSWITCH',
        relay_state: 1,
      }),
    });
    eventTpLink.emit('device-online', {
      getSysInfo: fake.resolves({
        deviceId: 2,
        mic_type: 'IOT.SMARTBULB',
        relay_state: 1,
      }),
    });
    eventTpLink.emit('device-online', {
      getSysInfo: fake.resolves({
        deviceId: 2,
        mic_type: 'IOT.SMARTBULB',
        relay_state: 1,
      }),
    });
    eventTpLink.emit('device-online', {
      getSysInfo: fake.resolves({
        deviceId: 3,
        mic_type: 'unknown',
        relay_state: 1,
      }),
    });
    // ASSERT
    return promise.then((detectedDevices) => {
      // Check event listeners have been removed
      assert.match(eventTpLink.listenerCount(), 0);
      // Only 3 devices must be returned because two have same id
      assert.match(detectedDevices.length, 3);
    });
  }).timeout(3000);
});
