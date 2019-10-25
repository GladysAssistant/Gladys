const sinon = require('sinon');
const { expect } = require('chai');

const { assert, spy, fake } = sinon;
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const Zigbee2mqttHandler = require('../../../../services/zigbee2mqtt/lib');

const gladys = {
  event: {
    emit: spy(),
  },
  stateManager: {
    get: fake.returns(null),
  },
};

describe('Zigbee2mqtt handle message', () => {
  const zigbee2mqttHandler = new Zigbee2mqttHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');

  beforeEach(async () => {
    sinon.reset();
  });

  it('discover new device', () => {
    const message = [
      {
        friendly_name: 'name',
        model: 'model',
        powerSource: 'Battery',
        type: 'EndDevice',
      },
    ];
    zigbee2mqttHandler.handleMqttMessage('zigbee2mqtt/bridge/config/devices', JSON.stringify(message));

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, sinon.match.object);
    const lastCallLastArg = gladys.event.emit.lastCall.lastArg;
    expect(lastCallLastArg.type).to.eq(WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER);
    expect(lastCallLastArg.payload).to.be.lengthOf(1);
    expect(lastCallLastArg.payload[0]).to.have.property('external_id', 'zigbee2mqtt:name');
    expect(lastCallLastArg.payload[0]).to.not.have.property('id');
  });

  it('discover no device (no feature)', () => {
    const message = [
      {
        friendly_name: 'name',
        model: 'model',
        powerSource: 'power',
        type: 'EndDevice',
      },
    ];
    zigbee2mqttHandler.handleMqttMessage('zigbee2mqtt/bridge/config/devices', JSON.stringify(message));

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, sinon.match.object);
    const lastCallLastArg = gladys.event.emit.lastCall.lastArg;
    expect(lastCallLastArg.type).to.eq(WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER);
    expect(lastCallLastArg.payload).to.be.lengthOf(0);
  });

  it('discover no device (no EndDevice)', () => {
    const message = [
      {
        friendly_name: 'name',
        model: 'model',
        powerSource: 'Battery',
        type: 'unknown',
      },
    ];
    zigbee2mqttHandler.handleMqttMessage('zigbee2mqtt/bridge/config/devices', JSON.stringify(message));

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, sinon.match.object);
    const lastCallLastArg = gladys.event.emit.lastCall.lastArg;
    expect(lastCallLastArg.type).to.eq(WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER);
    expect(lastCallLastArg.payload).to.be.lengthOf(0);
  });
});
