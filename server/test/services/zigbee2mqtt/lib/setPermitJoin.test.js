const sinon = require('sinon');

const { assert, fake } = sinon;
const { expect } = require('chai');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const Zigbee2MqttService = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt setPermitJoin', () => {
  // PREPARE
  let zigbee2MqttManager;
  let gladys;
  let mqttClient;

  beforeEach(() => {
    gladys = {
      job: {
        wrapper: (type, func) => {
          return async () => {
            return func();
          };
        },
      },
      event: {
        emit: fake.resolves(null),
      },
    };
    mqttClient = {
      publish: fake.resolves(true),
    };

    zigbee2MqttManager = new Zigbee2MqttService(gladys, {}, serviceId);
    zigbee2MqttManager.z2mPermitJoin = false;
    zigbee2MqttManager.mqttClient = mqttClient;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('set permit join ', async () => {
    // EXECUTE
    await zigbee2MqttManager.setPermitJoin();
    // ASSERT
    assert.calledWith(mqttClient.publish, 'zigbee2mqtt/bridge/request/permit_join', 'true');
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: true,
    });
    expect(zigbee2MqttManager.z2mPermitJoin).to.equal(true);
  });
});
