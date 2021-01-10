const { assert, fake, reset } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const TpLinkApiClient = require('../mocks.test');
const devices = require('../devices.json');

const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

const TpLinkService = proxyquire('../../../../services/tp-link/index', {
  'tplink-smarthome-api': TpLinkApiClient,
});

const StateManager = require('../../../../lib/state');
const { TP_LINK_ON } = require('../../../../services/tp-link/lib/utils/consts');

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

describe('TpLinkService SetValue', () => {
  beforeEach(async () => {
    // Reset all fakes invoked
    reset();
  });

  it('should turn on plug', async () => {
    // PREPARE
    // Mock Sysinfo fetch to answer plug type
    const plugDevice = {
      getSysInfo: fake.resolves({
        type: 'IOT.SMARTPLUGSWITCH',
        relay_state: 0,
      }),
      setPowerState: fake.resolves(true),
    };
    TpLinkApiClient.Client.prototype.getDevice = fake.resolves(plugDevice);

    // EXECUTE
    await tpLinkService.device.setValue(devices[0], { category: DEVICE_FEATURE_CATEGORIES.SWITCH }, 1);

    // ASSERT
    assert.calledWith(plugDevice.setPowerState, TP_LINK_ON);
  });
  it('should turn on bulb', async () => {
    // PREPARE
    // Mock Sysinfo fetch to answer bulb type
    const bulbDevice = {
      getSysInfo: fake.resolves({
        mic_type: 'IOT.SMARTBULB',
        light_state: {
          on_off: 1,
        },
      }),
      setPowerState: fake.resolves(true),
    };
    TpLinkApiClient.Client.prototype.getDevice = fake.resolves(bulbDevice);

    // EXECUTE
    await tpLinkService.device.setValue(devices[1], { category: DEVICE_FEATURE_CATEGORIES.LIGHT }, 1);

    // ASSERT
    assert.calledWith(bulbDevice.setPowerState, TP_LINK_ON);
  });
  it('should return device not found', async () => {
    try {
      // EXECUTE
      await tpLinkService.device.setValue(
        {
          external_id: 'tp-link:0000',
        },
        { category: DEVICE_FEATURE_CATEGORIES.SWITCH },
        1,
      );
      // ASSERT
      assert.fail();
    } catch (err) {
      assert.match(err.message, 'TP_LINK_DEVICE_NOT_FOUND');
    }
  });
  it('should return device not online', async () => {
    try {
      // PREPARE
      // Mock Sysinfo fetch to answer bulb type
      TpLinkApiClient.Client.prototype.getDevice = fake.resolves(null);
      // EXECUTE
      await tpLinkService.device.setValue(devices[0], { category: DEVICE_FEATURE_CATEGORIES.SWITCH }, 1);
      // ASSERT
      assert.fail();
    } catch (err) {
      assert.match(err.message, 'TP_LINK_DEVICE_NOT_ONLINE');
    }
  });
  it('should return feature not managed', async () => {
    try {
      // PREPARE
      // Mock Sysinfo fetch to answer bulb type
      TpLinkApiClient.Client.prototype.getDevice = fake.resolves({
        getSysInfo: fake.resolves({
          mic_type: 'IOT.SMARTBULB',
          light_state: {
            on_off: 1,
          },
        }),
        setPowerState: fake.resolves(true),
      });
      // EXECUTE
      await tpLinkService.device.setValue(devices[0], { category: 'unknown' }, 1);
      // ASSERT
      assert.fail();
    } catch (err) {
      assert.match(err.message, 'TP_LINK_FEATURE_NOT_MANAGED');
    }
  });
});
