const sinon = require('sinon');

const { assert, fake } = sinon;
const { assert: assertC } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const Zigbee2MqttService = proxyquire('../../../../services/zigbee2mqtt', {});

const event = {
  emit: fake.resolves(null),
};

const container = {
  id: 'docker-test',
};

const gladys = {
  event,
  variable: {
    setValue: fake.resolves(true),
  },
  system: {
    getContainers: fake.resolves([container]),
    stopContainer: fake.resolves(true),
  },
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const mqtt = {
  end: fake.resolves(true),
  removeAllListeners: fake.resolves(true),
};

describe('zigbee2mqtt disconnect', () => {
  // PREPARE
  const zigbee2MqttService = Zigbee2MqttService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('mqtt not connected', async () => {
    // EXECUTE
    await zigbee2MqttService.device.disconnect();
    // ASSERT
    assert.calledWith(gladys.variable.setValue, 'ZIGBEE2MQTT_ENABLED', false, serviceId);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
    assert.calledThrice(gladys.event.emit);
    assert.calledTwice(gladys.system.stopContainer);
    assertC.isFalse(zigbee2MqttService.device.gladysConnected);
    assertC.isFalse(zigbee2MqttService.device.z2mEnabled);
    assertC.isFalse(zigbee2MqttService.device.mqttRunning);
    assertC.isFalse(zigbee2MqttService.device.zigbee2mqttRunning);
    assertC.isFalse(zigbee2MqttService.device.zigbee2mqttConnected);
  });

  it('mqtt connected', async () => {
    // PREPARE
    zigbee2MqttService.device.mqttClient = mqtt;
    // EXECUTE
    await zigbee2MqttService.device.disconnect();
    // ASSERT
    assert.calledWith(gladys.variable.setValue, 'ZIGBEE2MQTT_ENABLED', false, serviceId);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
    assert.calledThrice(gladys.event.emit);
    assert.calledTwice(gladys.system.stopContainer);
    assertC.isFalse(zigbee2MqttService.device.gladysConnected);
    assertC.isFalse(zigbee2MqttService.device.z2mEnabled);
    assertC.isFalse(zigbee2MqttService.device.mqttRunning);
    assertC.isFalse(zigbee2MqttService.device.zigbee2mqttRunning);
    assertC.isFalse(zigbee2MqttService.device.zigbee2mqttConnected);

    assertC.isNull(zigbee2MqttService.device.mqttClient);
    assert.calledOnce(mqtt.end);
    assert.calledOnce(mqtt.removeAllListeners);
  });
});
