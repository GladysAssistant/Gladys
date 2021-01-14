const { assert, fake, reset } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const TpLinkApiClient = require('../mocks.test');
const devices = require('../devices.json');

const { EVENTS, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const TpLinkService = proxyquire('../../../../services/tp-link/index', {
  'tplink-smarthome-api': TpLinkApiClient,
});

const StateManager = require('../../../../lib/state');

const event = {
  emit: fake.resolves(null),
};
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

describe('TpLinkService Poll', () => {
  beforeEach(async () => {
    // Reset all fakes invoked
    reset();
  });

  it('should poll plug', async () => {
    // PREPARE
    // Mock Sysinfo fetch to answer plug type
    TpLinkApiClient.Client.prototype.getDevice = fake.resolves({
      getSysInfo: fake.resolves({
        type: 'IOT.SMARTPLUGSWITCH',
        relay_state: 1,
      }),
    });

    // EXECUTE
    await tpLinkService.device.poll(devices[0]);

    // ASSERT
    assert.calledOnce(event.emit);
    assert.calledWith(event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `tp-link:1234:${DEVICE_FEATURE_TYPES.SWITCH.BINARY}`,
      state: 1,
    });
  });
  it('should poll bulb', async () => {
    // PREPARE
    // Mock Sysinfo fetch to answer bulb type
    TpLinkApiClient.Client.prototype.getDevice = fake.resolves({
      getSysInfo: fake.resolves({
        mic_type: 'IOT.SMARTBULB',
        light_state: {
          on_off: 1,
        },
      }),
    });

    // EXECUTE
    await tpLinkService.device.poll(devices[1]);

    // ASSERT
    assert.calledOnce(event.emit);
    assert.calledWith(event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: `tp-link:1235:${DEVICE_FEATURE_TYPES.LIGHT.BINARY}`,
      state: 1,
    });
  });
  it('should return device found', async () => {
    try {
      // EXECUTE
      await tpLinkService.device.poll({
        external_id: 'tp-link:0000',
      });
      // ASSERT
      assert.fail();
    } catch (err) {
      assert.match(err.message, 'TP_LINK_DEVICE_NOT_FOUND');
    }
  });

  it('should return device not managed', async () => {
    try {
      // PREPARE
      // Mock Sysinfo fetch to answer bulb type
      TpLinkApiClient.Client.prototype.getDevice = fake.resolves({
        getSysInfo: fake.resolves({
          mic_type: 'unknown',
        }),
      });
      // EXECUTE
      await tpLinkService.device.poll({
        external_id: 'tp-link:1234',
      });
      // ASSERT
      assert.fail();
    } catch (err) {
      assert.match(err.message, 'TP_LINK_DEVICE_NOT_MANAGED');
    }
  });
});
