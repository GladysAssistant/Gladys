const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const zigbeeDevices = require('./payloads/mqtt_devices_get.json');
const expectedDevicesPayload = require('./payloads/event_device_result.json');

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const Zigbee2mqttManager = proxyquire('../../../../services/zigbee2mqtt/lib', {});

const event = {
  emit: fake.resolves(null),
};

const gladys = {
  event,
  variable: {
    setValue: fake.resolves(true),
  },
  stateManager: {
    get: fake.resolves(true),
  },
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt handleMqttMessage', () => {
  // PREPARE
  const zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
  let stateManagerGetStub;

  beforeEach(() => {
    sinon.reset();
    zigbee2mqttManager.zigbee2mqttConnected = false;
  });

  it('it should receive devices', async () => {
    // PREPARE
    stateManagerGetStub = sinon.stub();
    stateManagerGetStub
      .onFirstCall()
      .returns(true)
      .onSecondCall()
      .returns(false)
      .onThirdCall()
      .returns(false);
    zigbee2mqttManager.gladys.stateManager.get = stateManagerGetStub;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/devices', JSON.stringify(zigbeeDevices));
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER,
      payload: expectedDevicesPayload,
    });
  });

  it('it should get permit join from config', async () => {
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/config', `{"permit_join": true}`);
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: true,
    });
    assert.match(zigbee2mqttManager.z2mPermitJoin, true);
  });

  it('it should get permit join from response/permit_join', async () => {
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/response/permit_join', `{"data": {"value": true}}`);
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: true,
    });
    assert.match(zigbee2mqttManager.z2mPermitJoin, true);
  });

  it('it should get permit join from config/permit_join', async () => {
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/config/permit_join', `true`);
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: true,
    });
    assert.match(zigbee2mqttManager.z2mPermitJoin, true);
  });

  it('it should get empty message', async () => {
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/anytopic', ``);
    // ASSERT
    assert.calledOnce(gladys.event.emit);
  });

  it('it should log error when bad message but not crash service', async () => {
    // PREPARE
    stateManagerGetStub = sinon.stub();
    stateManagerGetStub.onFirstCall().returns({
      features: [
        {
          external_id: 'zigbee2mqtt:0x00158d0005828ece:battery:integer:battery',
          type: 'battery',
        },
      ],
    });
    zigbee2mqttManager.gladys.stateManager.get = stateManagerGetStub;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/device', `{"battery":"LOCK"}`);
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
    });
  });

  it('it should get bad topic', async () => {
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/anytopic/wrongtopic', `anymessage`);
    // ASSERT
    assert.calledOnce(gladys.event.emit);
  });

  it('it should get good topic', async () => {
    // PREPARE
    stateManagerGetStub = sinon.stub();
    stateManagerGetStub.onFirstCall().returns({
      features: [
        {
          external_id: 'zigbee2mqtt:0x00158d00033e88d5:battery:integer:battery',
          type: 'battery',
        },
      ],
    });
    zigbee2mqttManager.gladys.stateManager.get = stateManagerGetStub;
    zigbeeDevices
      .filter((d) => d.supported)
      .forEach((device) => {
        zigbee2mqttManager.discoveredDevices[device.friendly_name] = device;
      });
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/0x00158d00033e88d5', `{"humidity":86, "battery":59}`);
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'zigbee2mqtt:0x00158d00033e88d5:battery:integer:battery',
      state: 59,
    });
  });

  it('it should get good topic but device not managed', async () => {
    // PREPARE
    stateManagerGetStub = sinon.stub();
    stateManagerGetStub.onFirstCall().returns(null);
    zigbee2mqttManager.gladys.stateManager.get = stateManagerGetStub;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/device', `{"humidity":86, "battery":59}`);
    // ASSERT
    assert.calledOnce(gladys.event.emit);
  });

  it('it should get good topic but feature not managed', async () => {
    // PREPARE
    stateManagerGetStub = sinon.stub();
    stateManagerGetStub.onFirstCall().returns({
      features: [
        {
          external_id: 'zigbee2mqtt:0x00158d0005828ece:battery:integer:battery',
          type: 'battery',
        },
      ],
    });
    zigbee2mqttManager.gladys.stateManager.get = stateManagerGetStub;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/device', `{"humidity":86}`);
    // ASSERT
    assert.calledOnce(gladys.event.emit);
  });
});
