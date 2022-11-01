const { expect } = require('chai');
const sinon = require('sinon');
const { fake, assert } = require('sinon');

const Zigbee2MqttManager = require('../../../../services/zigbee2mqtt/lib');

const mqttLibrary = {};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt getZ2mBackup', () => {
  // PREPARE
  let zigbee2MqttManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      variable: {
        getValue: fake.resolves('fake'),
      },
    };

    zigbee2MqttManager = new Zigbee2MqttManager(gladys, mqttLibrary, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should load stored z2m backup', async () => {
    // EXECUTE
    const result = await zigbee2MqttManager.getZ2mBackup();
    // ASSERT
    assert.callCount(gladys.variable.getValue, 1);
    assert.calledWithExactly(gladys.variable.getValue, 'Z2M_BACKUP', serviceId);

    expect(result).to.deep.equal('fake');
  });
});
