const sinon = require('sinon');
const { fake, assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

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
      },
    };

    zigbee2MqttManager = new Zigbee2MqttManager(gladys, mqttLibrary, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should store USB configuration, and reload Z2M containers', async () => {
    // PREPARE
    const usbConfig = {
      ZIGBEE2MQTT_DRIVER_PATH: 'usb0',
      ZIGBEE_DONGLE_NAME: 'dongle-name',
    };
    // EXECUTE
    await zigbee2MqttManager.setup(usbConfig);
    // ASSERT
    assert.callCount(gladys.variable.setValue, 2);
    assert.calledWithExactly(gladys.variable.setValue, 'ZIGBEE2MQTT_DRIVER_PATH', 'usb0', serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'ZIGBEE_DONGLE_NAME', 'dongle-name', serviceId);

    // z2m was not running, we don't reload it
    assert.calledOnceWithExactly(init);
  });
});
