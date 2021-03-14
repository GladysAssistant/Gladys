const sinon = require('sinon');

const { assert, fake } = sinon;

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../../../utils/constants');
const { BLUETOOTH } = require('../../../../../../services/awox/lib/handlers/legacy/utils/awox.legacy.constants');

const AwoxLegacyManager = require('../../../../../../services/awox/lib/handlers/legacy');

describe('awox.legacy.setValue', () => {
  const peripheral = {};
  const bluetooth = {
    applyOnPeripheral: fake.yields(peripheral),
    writeDevice: fake.resolves(null),
  };
  const gladys = {};
  let manager;

  beforeEach(() => {
    manager = new AwoxLegacyManager(gladys, bluetooth);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('send value over Bluetooth', async () => {
    const device = {
      external_id: 'bluetooth:AABBCCDDEE',
      model: 'any_compatible',
    };

    const feature = {
      external_id: 'bluetooth:AABBCCDDEE:switch',
      category: DEVICE_FEATURE_CATEGORIES.LIGHT,
      type: DEVICE_FEATURE_TYPES.LIGHT.BINARY,
    };
    const value = 1;

    await manager.setValue(device, feature, value);

    assert.calledOnce(bluetooth.applyOnPeripheral);
    assert.calledWith(
      bluetooth.writeDevice,
      peripheral,
      BLUETOOTH.SERVICE_ID,
      BLUETOOTH.CHARACTERISTIC_ID,
      sinon.match.any,
    );
  });
});
