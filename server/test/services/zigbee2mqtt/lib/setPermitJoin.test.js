const sinon = require('sinon');

const { assert, fake } = sinon;
const { assert: assertC } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

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

describe('zigbee2mqtt setPermitJoin', () => {
  // PREPARE
  const zigbee2MqttService = new Zigbee2MqttService(gladys, serviceId);
  zigbee2MqttService.device.z2mPermitJoin = false;
  zigbee2MqttService.device.mqttClient = mqtt;

  it('set permit join ', async () => {
    // EXECUTE
    await zigbee2MqttService.device.setPermitJoin();
    // ASSERT
    assert.calledWith(mqtt.publish, 'zigbee2mqtt/bridge/config/permit_join', 'true');
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: true,
    });
    assertC.equal(zigbee2MqttService.device.z2mPermitJoin, true);
  });
});
