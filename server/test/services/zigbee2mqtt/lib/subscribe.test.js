const sinon = require('sinon');

const { assert, fake } = sinon;
const { assert: assertC } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const Zigbee2MqttService = proxyquire('../../../../services/zigbee2mqtt', {});

const gladys = {};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const mqtt = {
  subscribe: fake.resolves(true),
};

describe('zigbee2mqtt subscribe', () => {
  // PREPARE
  let zigbee2MqttService;

  beforeEach(() => {
    zigbee2MqttService = Zigbee2MqttService(gladys, serviceId);
    zigbee2MqttService.device.topicBinds = [];
    sinon.reset();
  });

  it('subscribe ', async () => {
    // PREPARE
    zigbee2MqttService.device.mqttClient = mqtt;
    // EXECUTE
    await zigbee2MqttService.device.subscribe('topic', 'callback');
    // ASSERT
    assert.calledWith(mqtt.subscribe, 'topic');
    assertC.equal(zigbee2MqttService.device.topicBinds.topic, 'callback');
  });

  it('subscribe without mqtt', async () => {
    // EXECUTE
    await zigbee2MqttService.device.subscribe('topic', 'callback');
    // ASSERT
    assert.notCalled(mqtt.subscribe);
    assertC.equal(zigbee2MqttService.device.topicBinds.topic, 'callback');
  });
});
