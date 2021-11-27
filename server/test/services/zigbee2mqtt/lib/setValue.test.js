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

const wrongFeature = {
  external_id: 'NOTzigbee2mqtt:device-test:switch:binary:state',
};

const wrongTopic = {
  external_id: 'zigbee2mqtt:',
};

const wrongProperty = {
  external_id: 'zigbee2mqtt:device-test:switch:binary',
};

const featureBinary = {
  external_id: 'zigbee2mqtt:device-test:switch:binary:state',
  type: 'binary',
};

const featureBrightness = {
  external_id: 'zigbee2mqtt:device-test:light:brightness:brightness',
  type: 'brightness',
};

const featureTemperature = {
  external_id: 'zigbee2mqtt:device-test:light:temperature:color_temp',
  type: 'temperature',
};

const featureColor = {
  external_id: 'zigbee2mqtt:device-test:light:color:color',
  type: 'color',
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
      await zigbee2MqttService.device.setValue(null, wrongFeature, null);
      assert.fail();
    } catch (e) {
      assertC.equal(
        e.message,
        `Zigbee2mqtt device external_id is invalid : "${wrongFeature.external_id}" should starts with "zigbee2mqtt:"`,
      );
    }
  });
  it('set value bad topic', async () => {
    // EXECUTE
    try {
      await zigbee2MqttService.device.setValue(null, wrongTopic, null);
      assert.fail();
    } catch (e) {
      assertC.equal(
        e.message,
        `Zigbee2mqtt device external_id is invalid : "${wrongTopic.external_id}" have no MQTT topic`,
      );
    }
  });
  it('set value bad property', async () => {
    // EXECUTE
    try {
      await zigbee2MqttService.device.setValue(null, wrongProperty, null);
      assert.fail();
    } catch (e) {
      assertC.equal(
        e.message,
        `Zigbee2mqtt device external_id is invalid : "${wrongProperty.external_id}" have no Zigbee property`,
      );
    }
  });
  it('set value good topic ON', async () => {
    // EXECUTE
    await zigbee2MqttService.device.setValue(null, featureBinary, true);
    assert.calledOnceWithExactly(mqtt.publish, `zigbee2mqtt/device-test/set`, JSON.stringify({ state: 'ON' }));
  });
  it('set value good topic OFF', async () => {
    // EXECUTE
    await zigbee2MqttService.device.setValue(null, featureBinary, false);
    assert.calledOnceWithExactly(mqtt.publish, `zigbee2mqtt/device-test/set`, JSON.stringify({ state: 'OFF' }));
  });
  it('set value good topic brightness', async () => {
    // EXECUTE
    await zigbee2MqttService.device.setValue(null, featureBrightness, 150);
    assert.calledOnceWithExactly(mqtt.publish, `zigbee2mqtt/device-test/set`, JSON.stringify({ brightness: 150 }));
  });
  it('set value good topic temperature', async () => {
    // EXECUTE
    await zigbee2MqttService.device.setValue(null, featureTemperature, 56);
    assert.calledOnceWithExactly(mqtt.publish, `zigbee2mqtt/device-test/set`, JSON.stringify({ color_temp: 56 }));
  });
  it('set value good topic color', async () => {
    // EXECUTE
    await zigbee2MqttService.device.setValue(null, featureColor, 255);
    assert.calledOnceWithExactly(
      mqtt.publish,
      `zigbee2mqtt/device-test/set`,
      JSON.stringify({ color: { rgb: '0,0,255' } }),
    );
  });
});
