const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const Zigbee2MqttManager = require('../../../../services/zigbee2mqtt/lib');

const mqttLibrary = {};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt getSetup', () => {
  // PREPARE
  let zigbee2MqttManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
      variable: {
        getValue: fake.resolves('fake'),
      },
    };

    zigbee2MqttManager = new Zigbee2MqttManager(gladys, mqttLibrary, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should retrieve all configruation variables', async () => {
    // EXECUTE
    const config = await zigbee2MqttManager.getSetup();
    // ASSERT
    assert.callCount(gladys.variable.getValue, 7);
    assert.calledWithExactly(gladys.variable.getValue, 'ZIGBEE2MQTT_DRIVER_PATH', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'ZIGBEE_DONGLE_NAME', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'Z2M_TCP_PORT', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'Z2M_MQTT_URL', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'GLADYS_MQTT_USERNAME', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'GLADYS_MQTT_PASSWORD', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'Z2M_MQTT_MODE', serviceId);

    // z2m was not running, we don't reload it
    expect(config).deep.eq({
      ZIGBEE2MQTT_DRIVER_PATH: 'fake',
      ZIGBEE_DONGLE_NAME: 'fake',
      Z2M_TCP_PORT: 'fake',
      Z2M_MQTT_MODE: 'fake',
      GLADYS_MQTT_PASSWORD: 'fake',
      Z2M_MQTT_URL: 'fake',
      GLADYS_MQTT_USERNAME: 'fake',
    });
  });
});
