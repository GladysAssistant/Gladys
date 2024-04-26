const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const zigbeeDevices = require('./payloads/mqtt_devices_get.json');
const expectedDevicesPayload = require('./payloads/event_device_result.json');

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt handleMqttMessage', () => {
  // PREPARE
  let zigbee2mqttManager;
  let stateManagerGetStub;
  let gladys;

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
      stateManager: {
        get: fake.resolves(true),
      },
    };

    zigbee2mqttManager = new Zigbee2mqttManager(gladys, null, serviceId);
    zigbee2mqttManager.zigbee2mqttConnected = true;
    zigbee2mqttManager.dockerBased = true;
    zigbee2mqttManager.networkModeValid = true;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should set at connected / exist / running', async () => {
    // PREPARE
    zigbee2mqttManager.zigbee2mqttConnected = false;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/unkown', JSON.stringify({}));
    // ASSERT
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: false,
        mqttRunning: false,
        networkModeValid: true,
        usbConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: true,
        zigbee2mqttExist: true,
        zigbee2mqttRunning: true,
      },
    });
  });

  it('should receive devices', async () => {
    // PREPARE
    stateManagerGetStub = sinon.stub();
    stateManagerGetStub
      .onFirstCall()
      .returns({ id: 'gladys-id', room_id: 'room_id', name: 'device-name' })
      .onSecondCall()
      .returns(expectedDevicesPayload[1])
      .onThirdCall()
      .returns(null);
    zigbee2mqttManager.gladys.stateManager.get = stateManagerGetStub;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/devices', JSON.stringify(zigbeeDevices));
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER,
      payload: expectedDevicesPayload,
    });
    expect(zigbee2mqttManager.zigbee2mqttConnected).to.eq(true);
  });

  it('should get permit join from config', async () => {
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/config', `{"permit_join": true}`);
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: true,
    });
    expect(zigbee2mqttManager.z2mPermitJoin).to.equal(true);
  });

  it('should get permit join from response/permit_join', async () => {
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/response/permit_join', `{"data": {"value": true}}`);
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: true,
    });
    expect(zigbee2mqttManager.z2mPermitJoin).to.equal(true);
  });

  it('it should get permit join from config/permit_join', async () => {
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/config/permit_join', `true`);
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: true,
    });
    expect(zigbee2mqttManager.z2mPermitJoin).to.equal(true);
  });

  it('it should get empty message', async () => {
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/anytopic', ``);
    // ASSERT
    assert.notCalled(gladys.event.emit);
    expect(zigbee2mqttManager.zigbee2mqttConnected).to.eq(true);
  });

  it('should log error when bad message but not crash service', async () => {
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
    assert.notCalled(gladys.event.emit);
    expect(zigbee2mqttManager.zigbee2mqttConnected).to.eq(true);
  });

  it('should get bad topic', async () => {
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/anytopic/wrongtopic', `anymessage`);
    // ASSERT
    assert.notCalled(gladys.event.emit);
    expect(zigbee2mqttManager.zigbee2mqttConnected).to.eq(true);
  });

  it('should get good topic', async () => {
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
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'zigbee2mqtt:0x00158d00033e88d5:battery:integer:battery',
      state: 59,
    });
    expect(zigbee2mqttManager.zigbee2mqttConnected).to.eq(true);
  });

  it('should get good topic with sub-feature', async () => {
    // PREPARE
    stateManagerGetStub = sinon.stub();
    stateManagerGetStub.onFirstCall().returns({
      features: [
        {
          external_id: 'zigbee2mqtt:0x00158d00033e88d1:button:click:action:2',
          type: 'click',
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
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/0x00158d00033e88d1', `{"action": "2_double"}`);
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: 'zigbee2mqtt:0x00158d00033e88d1:button:click:action:2',
      state: 2,
    });
    expect(zigbee2mqttManager.zigbee2mqttConnected).to.eq(true);
  });

  it('should get good topic but device not managed', async () => {
    // PREPARE
    stateManagerGetStub = sinon.stub();
    stateManagerGetStub.onFirstCall().returns(null);
    zigbee2mqttManager.gladys.stateManager.get = stateManagerGetStub;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/device', `{"humidity":86, "battery":59}`);
    // ASSERT
    assert.notCalled(gladys.event.emit);
    expect(zigbee2mqttManager.zigbee2mqttConnected).to.eq(true);
  });

  it('should get good topic but feature not managed', async () => {
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
    assert.notCalled(gladys.event.emit);
    expect(zigbee2mqttManager.zigbee2mqttConnected).to.eq(true);
  });

  it('should store backup', async () => {
    zigbee2mqttManager.saveZ2mBackup = fake.resolves(true);

    // PREPARE
    const payload = {
      status: 'ko',
    };
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/response/backup', JSON.stringify(payload));
    // ASSERT
    assert.calledOnceWithExactly(zigbee2mqttManager.saveZ2mBackup, payload);
    assert.notCalled(gladys.event.emit);
    expect(zigbee2mqttManager.zigbee2mqttConnected).to.eq(true);
  });
});
