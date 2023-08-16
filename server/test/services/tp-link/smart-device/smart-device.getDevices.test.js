const EventEmitter = require('events');
const sinon = require('sinon');
const { expect } = require('chai');

const { fake, stub } = sinon;

const devices = require('../devices.json');
const { Client } = require('../mocks.test');
const TPLinkSmartDevicetHandler = require('../../../../services/tp-link/lib/smart-device');

const StateManager = require('../../../../lib/state');

const serviceId = 'a810b8db-6d04-4697-bed3-c4b72c996279';

describe('TpLinkService GetDevices', () => {
  let tpLinkDeviceHandler;
  let tpLinkClient;
  let eventTpLink;

  beforeEach(() => {
    const event = new EventEmitter();
    const stateManager = new StateManager(event);
    eventTpLink = new EventEmitter();

    const deviceManager = {
      get: fake.resolves(devices),
    };

    const gladys = {
      device: deviceManager,
      stateManager,
      event,
    };

    tpLinkClient = new Client();
    tpLinkDeviceHandler = new TPLinkSmartDevicetHandler(gladys, tpLinkClient, serviceId);
    tpLinkDeviceHandler.discoverDevicesDelay = 0;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start discovery', async () => {
    // PREPARE
    stub(tpLinkClient, 'startDiscovery').callsFake(() => eventTpLink);
    // EXECUTE
    const promise = tpLinkDeviceHandler.getDevices();
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
    const detectedDevices = await promise;
    // Check event listeners have been removed
    expect(eventTpLink.listenerCount()).eq(0);
    // Only 3 devices must be returned because two have same id
    expect(detectedDevices.length).eq(3);
  });
});
