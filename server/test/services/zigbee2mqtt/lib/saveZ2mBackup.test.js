const sinon = require('sinon');
const { fake, assert } = require('sinon');

const Zigbee2MqttManager = require('../../../../services/zigbee2mqtt/lib');

const mqttLibrary = {};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt saveZ2mBackup', () => {
  // PREPARE
  let zigbee2MqttManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      variable: {
        setValue: fake.resolves('setValue'),
      },
    };

    zigbee2MqttManager = new Zigbee2MqttManager(gladys, mqttLibrary, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should store backup', async () => {
    // EXECUTE
    await zigbee2MqttManager.saveZ2mBackup('z2mBackup');
    // ASSERT
    assert.callCount(gladys.variable.setValue, 1);
    assert.calledWithExactly(gladys.variable.setValue, 'Z2M_BACKUP', 'z2mBackup', serviceId);
  });
});
