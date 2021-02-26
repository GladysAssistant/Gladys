const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

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

const zigbeeDevices = `[
    {
        "type":"Coordinator"
    },
    {
        "friendly_name":"0x00158d0005828ece",
        "model":"WSDCGQ11LM",
        "powerSource":"Battery",
        "type":"EndDevice"
    },
    {
        "friendly_name":"0x00158d0005828eca",
        "model":"fakeModel",
        "type":"EndDevice"
    },
    {
        "friendly_name":"0x00158d0005828ece",
        "model":"WSDCGQ11LM",
        "powerSource":"Battery",
        "type":"EndDevice"
    }
  ]`;

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';
const expectedDevicesPayload = [
  {
    external_id: 'zigbee2mqtt:0x00158d0005828eca',
    features: [],
    model: 'fakeModel',
    name: '0x00158d0005828eca',
    service_id: 'f87b7af2-ca8e-44fc-b754-444354b42fee',
    should_poll: false,
    supported: false,
  },
  {
    external_id: 'zigbee2mqtt:0x00158d0005828ece',
    features: [
      {
        category: 'temperature-sensor',
        external_id: 'zigbee2mqtt:0x00158d0005828ece:temperature-sensor:decimal',
        has_feedback: false,
        max: 125,
        min: -50,
        read_only: true,
        selector: 'zigbee2mqtt:0x00158d0005828ece:temperature-sensor:decimal',
        type: 'decimal',
        unit: 'celsius',
      },
      {
        category: 'humidity-sensor',
        external_id: 'zigbee2mqtt:0x00158d0005828ece:humidity-sensor:decimal',
        has_feedback: false,
        max: 100,
        min: 0,
        read_only: true,
        selector: 'zigbee2mqtt:0x00158d0005828ece:humidity-sensor:decimal',
        type: 'decimal',
        unit: 'percent',
      },
      {
        category: 'pressure-sensor',
        external_id: 'zigbee2mqtt:0x00158d0005828ece:pressure-sensor:decimal',
        has_feedback: false,
        max: 10000,
        min: 0,
        read_only: true,
        selector: 'zigbee2mqtt:0x00158d0005828ece:pressure-sensor:decimal',
        type: 'decimal',
        unit: undefined,
      },
      {
        category: 'battery',
        external_id: 'zigbee2mqtt:0x00158d0005828ece:battery:integer',
        has_feedback: false,
        max: 100,
        min: 0,
        read_only: true,
        selector: 'zigbee2mqtt:0x00158d0005828ece:battery:integer',
        type: 'integer',
        unit: 'percent',
      },
    ],
    model: 'WSDCGQ11LM',
    name: '0x00158d0005828ece',
    service_id: 'f87b7af2-ca8e-44fc-b754-444354b42fee',
    should_poll: false,
    supported: true,
  },
];

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
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/config/devices', zigbeeDevices);
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

  it('it should get bad topic', async () => {
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/anytopic/wrongtopic', `anymessage`);
    // ASSERT
    assert.calledOnce(gladys.event.emit);
  });

  it('it should get good topic', async () => {
    // PREPARE
    stateManagerGetStub = sinon.stub();
    stateManagerGetStub
      .onFirstCall()
      .returns(null)
      .onSecondCall()
      .returns({
        external_id: 'zigbee2mqtt:0x00158d0005828ece:battery:integer',
        type: 'battery',
      });
    zigbee2mqttManager.gladys.stateManager.get = stateManagerGetStub;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/device', `{"humidity":86, "battery":59}`);
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'zigbee2mqtt:0x00158d0005828ece:battery:integer',
      state: 59,
    });
  });

  it('it should get good topic but feature not managed', async () => {
    // PREPARE
    stateManagerGetStub = sinon.stub();
    stateManagerGetStub
      .onFirstCall()
      .throws()
      .onSecondCall()
      .returns({
        external_id: 'zigbee2mqtt:0x00158d0005828ece:battery:integer',
        type: 'battery',
      });
    zigbee2mqttManager.gladys.stateManager.get = stateManagerGetStub;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/device', `{"humidity":86, "battery":59}`);
    // ASSERT
    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'zigbee2mqtt:0x00158d0005828ece:battery:integer',
      state: 59,
    });
  });
});
