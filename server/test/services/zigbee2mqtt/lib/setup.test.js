const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const { fake, assert } = sinon;

const init = fake.resolves(true);
const Zigbee2MqttManager = proxyquire('../../../../services/zigbee2mqtt/lib', {
  './init': { init },
});

const mqttLibrary = {};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt setup', () => {
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
        setValue: fake.resolves('fake'),
        destroy: fake.resolves(null),
      },
    };

    zigbee2MqttManager = new Zigbee2MqttManager(gladys, mqttLibrary, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should store USB configuration, and reload Z2M containers', async () => {
    // PREPARE
    const config = {
      ZIGBEE2MQTT_DRIVER_PATH: 'usb0',
      ZIGBEE_DONGLE_NAME: 'dongle-name',
      Z2M_TCP_PORT: 'tcpPort',
    };
    // EXECUTE
    await zigbee2MqttManager.setup(config);
    // ASSERT
    assert.callCount(gladys.variable.setValue, 3);
    assert.calledWithExactly(gladys.variable.setValue, 'ZIGBEE2MQTT_DRIVER_PATH', 'usb0', serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'ZIGBEE_DONGLE_NAME', 'dongle-name', serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'Z2M_TCP_PORT', 'tcpPort', serviceId);

    // z2m was not running, we don't reload it
    assert.calledOnceWithExactly(init, true);
  });

  it('should store configuration for external broker', async () => {
    // PREPARE
    const config = {
      Z2M_MQTT_MODE: 'external',
      GLADYS_MQTT_USERNAME: '',
      Z2M_TCP_PORT: null,
      Z2M_MQTT_URL: 'mqtt://localhost',
      GLADYS_MQTT_PASSWORD: 'password',
      ZIGBEE_DONGLE_NAME: null,
      ZIGBEE2MQTT_DRIVER_PATH: null,
    };
    // EXECUTE
    await zigbee2MqttManager.setup(config);
    // ASSERT
    assert.callCount(gladys.variable.setValue, 4);
    assert.calledWithExactly(gladys.variable.setValue, 'Z2M_MQTT_URL', 'mqtt://localhost', serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'GLADYS_MQTT_USERNAME', '', serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'GLADYS_MQTT_PASSWORD', 'password', serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'Z2M_MQTT_MODE', 'external', serviceId);
    // Destroy variables
    assert.calledWithExactly(gladys.variable.destroy, 'Z2M_TCP_PORT', serviceId);
    assert.calledWithExactly(gladys.variable.destroy, 'ZIGBEE_DONGLE_NAME', serviceId);
    assert.calledWithExactly(gladys.variable.destroy, 'ZIGBEE2MQTT_DRIVER_PATH', serviceId);

    // z2m was not running, we don't reload it
    assert.calledOnceWithExactly(init, true);
  });
});
