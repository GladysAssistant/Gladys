const sinon = require('sinon');
const { fake, assert } = require('sinon');

const Zigbee2MqttManager = require('../../../../services/zigbee2mqtt/lib');

const mqttLibrary = {};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt saveConfiguration', () => {
  // PREPARE
  let zigbee2MqttManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      variable: {
        setValue: fake.resolves('setValue'),
        destroy: fake.resolves('destroy'),
      },
    };

    zigbee2MqttManager = new Zigbee2MqttManager(gladys, mqttLibrary, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should store all variables', async () => {
    // PREPARE
    const config = {
      z2mDriverPath: 'z2mDriverPath',
      z2mMqttUsername: 'z2mMqttUsername',
      z2mMqttPassword: 'z2mMqttPassword',
      mqttUrl: 'mqttUrl',
      mqttUsername: 'mqttUsername',
      mqttPassword: 'mqttPassword',
    };
    // EXECUTE
    await zigbee2MqttManager.saveConfiguration(config);
    // ASSERT
    assert.callCount(gladys.variable.setValue, 6);
    assert.calledWithExactly(gladys.variable.setValue, 'ZIGBEE2MQTT_DRIVER_PATH', config.z2mDriverPath, serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'Z2M_MQTT_USERNAME', config.z2mMqttUsername, serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'Z2M_MQTT_PASSWORD', config.z2mMqttPassword, serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'Z2M_MQTT_URL', config.mqttUrl, serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'GLADYS_MQTT_USERNAME', config.mqttUsername, serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'GLADYS_MQTT_PASSWORD', config.mqttPassword, serviceId);
  });

  it('should destroy all variables', async () => {
    // PREPARE
    const config = {};
    // EXECUTE
    await zigbee2MqttManager.saveConfiguration(config);
    // ASSERT
    assert.callCount(gladys.variable.destroy, 6);
    assert.calledWithExactly(gladys.variable.destroy, 'ZIGBEE2MQTT_DRIVER_PATH', serviceId);
    assert.calledWithExactly(gladys.variable.destroy, 'Z2M_MQTT_USERNAME', serviceId);
    assert.calledWithExactly(gladys.variable.destroy, 'Z2M_MQTT_PASSWORD', serviceId);
    assert.calledWithExactly(gladys.variable.destroy, 'Z2M_MQTT_URL', serviceId);
    assert.calledWithExactly(gladys.variable.destroy, 'GLADYS_MQTT_USERNAME', serviceId);
    assert.calledWithExactly(gladys.variable.destroy, 'GLADYS_MQTT_PASSWORD', serviceId);
  });
});
