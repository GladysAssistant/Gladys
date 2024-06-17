const { expect } = require('chai');
const sinon = require('sinon');
const { fake, assert } = require('sinon');

const Zigbee2MqttManager = require('../../../../services/zigbee2mqtt/lib');

const mqttLibrary = {};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt getConfiguration', () => {
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

  it('should load stored z2m configuration', async () => {
    // EXECUTE
    const result = await zigbee2MqttManager.getConfiguration();
    // ASSERT
    assert.callCount(gladys.variable.getValue, 12);
    assert.calledWithExactly(gladys.variable.getValue, 'ZIGBEE2MQTT_DRIVER_PATH', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'ZIGBEE_DONGLE_NAME', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'Z2M_TCP_PORT', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'Z2M_MQTT_USERNAME', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'Z2M_MQTT_PASSWORD', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'Z2M_MQTT_MODE', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'Z2M_MQTT_URL', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'GLADYS_MQTT_USERNAME', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'GLADYS_MQTT_PASSWORD', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'DOCKER_MQTT_VERSION', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'DOCKER_Z2M_VERSION', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'TIMEZONE');

    expect(result).to.deep.equal({
      z2mDriverPath: 'fake',
      z2mDongleName: 'fake',
      z2mTcpPort: 'fake',
      z2mMqttUsername: 'fake',
      z2mMqttPassword: 'fake',
      mqttUrl: 'fake',
      mqttMode: 'fake',
      mqttUsername: 'fake',
      mqttPassword: 'fake',
      dockerMqttVersion: 'fake',
      dockerZ2mVersion: 'fake',
      timezone: 'fake',
    });
  });
});
