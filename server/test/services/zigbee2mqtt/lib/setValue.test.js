const sinon = require('sinon');

const { assert, fake } = sinon;
const { assert: assertC } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const Zigbee2MqttService = proxyquire('../../../../services/zigbee2mqtt', {});

const event = {
  emit: fake.resolves(null),
};

const gladys = {
  event,
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const mqtt = {
  publish: fake.resolves(true),
};

const wrongDevice = {
  external_id: 'otherservice:',
};

const wrongTopic = {
  external_id: 'zigbee2mqtt:',
};

const device = {
  external_id: 'zigbee2mqtt:device-test',
};

const featureBinary = {
  type: 'binary',
};

const featureBrightness = {
  type: 'brightness',
};

const featureTemperature = {
  type: 'temperature',
};

const featureUnknown = {
  type: 'unknown',
};

describe('zigbee2mqtt setValue', () => {
  // PREPARE
  let zigbee2MqttService;

  beforeEach(() => {
    zigbee2MqttService = Zigbee2MqttService(gladys, serviceId);
    zigbee2MqttService.device.mqttClient = mqtt;
    sinon.reset();
  });

  it('set value not device zigbee', async () => {
    // EXECUTE
    try {
      await zigbee2MqttService.device.setValue(wrongDevice, null, null);
      assert.fail();
    } catch (e) {
      assertC.equal(
        e.message,
        `Zigbee2mqtt device external_id is invalid : "${wrongDevice.external_id}" should starts with "zigbee2mqtt:"`,
      );
    }
  });
  it('set value bad topic', async () => {
    // EXECUTE
    try {
      await zigbee2MqttService.device.setValue(wrongTopic, null, null);
      assert.fail();
    } catch (e) {
      assertC.equal(
        e.message,
        `Zigbee2mqtt device external_id is invalid : "${wrongTopic.external_id}" have no MQTT topic`,
      );
    }
  });
  it('set value good topic unknown feature', async () => {
    // EXECUTE
    await zigbee2MqttService.device.setValue(device, featureUnknown, 56);
    assert.notCalled(mqtt.publish);
  });
  it('set value good topic ON', async () => {
    // EXECUTE
    await zigbee2MqttService.device.setValue(device, featureBinary, true);
    assert.calledOnceWithExactly(mqtt.publish, `zigbee2mqtt/device-test/set`, `{"state": "ON"}`);
  });
  it('set value good topic OFF', async () => {
    // EXECUTE
    await zigbee2MqttService.device.setValue(device, featureBinary, false);
    assert.calledOnceWithExactly(mqtt.publish, `zigbee2mqtt/device-test/set`, `{"state": "OFF"}`);
  });
  it('set value good topic brightness', async () => {
    // EXECUTE
    await zigbee2MqttService.device.setValue(device, featureBrightness, 150);
    assert.calledOnceWithExactly(mqtt.publish, `zigbee2mqtt/device-test/set`, `{"brightness": 150}`);
  });
  it('set value good topic temperature', async () => {
    // EXECUTE
    await zigbee2MqttService.device.setValue(device, featureTemperature, 56);
    assert.calledOnceWithExactly(mqtt.publish, `zigbee2mqtt/device-test/set`, `{"color_temp": 56}`);
  });
});