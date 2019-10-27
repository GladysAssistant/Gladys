const sinon = require('sinon');
const { expect } = require('chai');

const { assert, spy, fake } = sinon;
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const Zigbee2mqttHandler = require('../../../../services/zigbee2mqtt/lib');

describe('Zigbee2mqtt handle message', () => {
  let zigbee2mqttHandler;
  let gladys;

  beforeEach(async () => {
    sinon.reset();

    gladys = {
      event: {
        emit: spy(),
      },
      stateManager: {
        get: fake.returns(null),
      },
    };

    zigbee2mqttHandler = new Zigbee2mqttHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
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

  it('discover existing device', () => {
    const gladysDevice = {
      id: '8d24d898-f26f-4885-bce7-ef1008d11d56',
      name: 'Zigbee2mqtt temp',
      selector: 'test-zigbee2mqtt-device',
      external_id: 'zigbee2mqtt:device',
    };
    gladys.stateManager.get = fake.returns(gladysDevice);

    const message = [
      {
        friendly_name: 'device',
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
    expect(lastCallLastArg.payload[0]).to.deep.eq(gladysDevice);
  });

  it('topic not managed (too small)', () => {
    const message = {};
    zigbee2mqttHandler.handleMqttMessage('zigbee2mqtt', JSON.stringify(message));

    assert.notCalled(gladys.event.emit);
  });

  it('topic not managed (too long)', () => {
    const message = {};
    zigbee2mqttHandler.handleMqttMessage('zigbee2mqtt/too/long', JSON.stringify(message));

    assert.notCalled(gladys.event.emit);
  });

  it('device state on no feature', () => {
    const message = {};
    zigbee2mqttHandler.handleMqttMessage('zigbee2mqtt/myDevice', JSON.stringify(message));

    assert.notCalled(gladys.event.emit);
  });

  it('device state on not existing feature', () => {
    const message = {
      state: 'on',
    };
    zigbee2mqttHandler.handleMqttMessage('zigbee2mqtt/myDevice', JSON.stringify(message));

    assert.notCalled(gladys.event.emit);
  });

  it('device state on existing feature', () => {
    const gladysFeature = {
      id: '8d24d898-f26f-4885-bce7-ef1008d11d56',
      name: 'Zigbee2mqtt temp feature',
      selector: 'test-zigbee2mqtt-device',
      external_id: 'zigbee2mqtt:device:temperature',
      category: 'temperature',
      type: 'decimal',
    };
    gladys.stateManager.get = fake.returns(gladysFeature);

    const message = {
      temperature: 23.5,
    };
    zigbee2mqttHandler.handleMqttMessage('zigbee2mqtt/device', JSON.stringify(message));

    const newState = {
      device_feature_external_id: 'zigbee2mqtt:device:temperature',
      state: 23.5,
    };
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, newState);
  });
});
