const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const zigbeeDevices = require('./payloads/mqtt_devices_get.json');
const expectedDevicesPayload = require('./payloads/event_device_result.json');

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');

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
    // A health check retry left pending must not fire during another test
    clearTimeout(zigbee2mqttManager.healthCheckTimer);
    sinon.restore();
  });

  it('should not consider Zigbee2mqtt online because a message is received', async () => {
    // PREPARE
    zigbee2mqttManager.zigbee2mqttConnected = false;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/unknown', JSON.stringify({}));
    // ASSERT
    expect(zigbee2mqttManager.zigbee2mqttConnected).to.equal(false);
    expect(zigbee2mqttManager.zigbee2mqttRunning).to.equal(false);
    expect(zigbee2mqttManager.zigbee2mqttExist).to.equal(false);
    assert.neverCalledWith(
      gladys.event.emit,
      EVENTS.WEBSOCKET.SEND_ALL,
      sinon.match.has('type', 'zigbee2mqtt.status-change'),
    );
  });

  it('should check the health of Zigbee2mqtt when it announces itself online on bridge/state', async () => {
    // PREPARE
    zigbee2mqttManager.zigbee2mqttConnected = false;
    zigbee2mqttManager.gladysConnected = true;
    zigbee2mqttManager.mqttClient = { publish: fake.returns(null) };
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', JSON.stringify({ state: 'online' }));
    // ASSERT
    // A retained "online" can be outdated: Zigbee2mqtt is online only once it answers the health check
    assert.calledOnceWithExactly(
      zigbee2mqttManager.mqttClient.publish,
      'zigbee2mqtt/bridge/request/health_check',
      '{}',
    );
    expect(zigbee2mqttManager.zigbee2mqttConnected).to.equal(false);
    expect(zigbee2mqttManager.zigbee2mqttRunning).to.equal(false);
    // bridge/state is never mistaken for the state of a device
    assert.notCalled(gladys.stateManager.get);
  });

  describe('health check retries', () => {
    const online = JSON.stringify({ state: 'online' });
    const healthy = JSON.stringify({ data: { healthy: true }, status: 'ok' });
    let clock;

    beforeEach(() => {
      clock = sinon.useFakeTimers();
      zigbee2mqttManager.zigbee2mqttConnected = false;
      zigbee2mqttManager.gladysConnected = true;
      zigbee2mqttManager.mqttClient = { publish: fake.returns(null) };
    });

    it('should ask again until Zigbee2mqtt answers, as it announces itself online before listening', async () => {
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', online);
      clock.tick(3000);
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/response/health_check', healthy);
      clock.tick(60000);
      // ASSERT
      assert.calledTwice(zigbee2mqttManager.mqttClient.publish);
      expect(zigbee2mqttManager.zigbee2mqttConnected).to.equal(true);
    });

    it('should keep asking while Zigbee2mqtt does not answer', async () => {
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', online);
      clock.tick(60000);
      // ASSERT
      // One request right away, then one every 3 seconds
      assert.callCount(zigbee2mqttManager.mqttClient.publish, 21);
      expect(zigbee2mqttManager.zigbee2mqttConnected).to.equal(false);
    });

    it('should stop asking when Zigbee2mqtt goes offline', async () => {
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', online);
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', JSON.stringify({ state: 'offline' }));
      clock.tick(60000);
      // ASSERT
      assert.calledOnce(zigbee2mqttManager.mqttClient.publish);
    });

    it('should stop asking once Gladys is disconnected from the broker', async () => {
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', online);
      const { publish } = zigbee2mqttManager.mqttClient;
      zigbee2mqttManager.mqttClient = null;
      clock.tick(60000);
      // ASSERT
      assert.calledOnce(publish);
    });

    it('should stop asking while Gladys has lost the broker, not to queue requests', async () => {
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', online);
      zigbee2mqttManager.gladysConnected = false;
      clock.tick(60000);
      // ASSERT
      assert.calledOnce(zigbee2mqttManager.mqttClient.publish);
    });

    it('should not ask when Gladys is not connected to the broker', async () => {
      // PREPARE
      zigbee2mqttManager.gladysConnected = false;
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', online);
      // ASSERT
      assert.notCalled(zigbee2mqttManager.mqttClient.publish);
    });
  });

  it('should set Zigbee2mqtt online when it answers the health check', async () => {
    // PREPARE
    zigbee2mqttManager.zigbee2mqttConnected = false;
    zigbee2mqttManager.zigbee2mqttStarting = true;
    zigbee2mqttManager.z2mContainerError = { code: null, message: 'error: a startup error' };
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage(
      'zigbee2mqtt/bridge/response/health_check',
      JSON.stringify({ data: { healthy: true }, status: 'ok' }),
    );
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
        networkAdapterConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: true,
        zigbee2mqttStarting: false,
        zigbee2mqttExist: true,
        zigbee2mqttRunning: true,
        coordinatorFirmware: null,
        z2mContainerError: null,
        mqttConnectionError: null,
      },
    });
  });

  it('should set Zigbee2mqtt offline from bridge/state', async () => {
    // PREPARE
    zigbee2mqttManager.zigbee2mqttConnected = true;
    zigbee2mqttManager.zigbee2mqttRunning = true;
    zigbee2mqttManager.zigbee2mqttExist = true;
    zigbee2mqttManager.zigbee2mqttStarting = true;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', JSON.stringify({ state: 'offline' }));
    // ASSERT
    expect(zigbee2mqttManager.zigbee2mqttConnected).to.equal(false);
    expect(zigbee2mqttManager.zigbee2mqttRunning).to.equal(false);
    // The container still exists, only Zigbee2mqtt is not running
    expect(zigbee2mqttManager.zigbee2mqttExist).to.equal(true);
    // Offline: Zigbee2mqtt is not starting anymore
    expect(zigbee2mqttManager.zigbee2mqttStarting).to.equal(false);
    assert.calledWith(
      gladys.event.emit,
      EVENTS.WEBSOCKET.SEND_ALL,
      sinon.match.has('type', 'zigbee2mqtt.status-change'),
    );
  });

  [
    ['an error answer', JSON.stringify({ data: {}, status: 'error', error: 'Health check failed' })],
    ['an unreadable answer', 'not json'],
  ].forEach(([label, message]) => {
    it(`should set Zigbee2mqtt online on ${label} to the health check, as it proves that it listens`, async () => {
      // PREPARE
      zigbee2mqttManager.zigbee2mqttConnected = false;
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/response/health_check', message);
      // ASSERT
      expect(zigbee2mqttManager.zigbee2mqttConnected).to.equal(true);
      expect(zigbee2mqttManager.zigbee2mqttRunning).to.equal(true);
    });
  });

  it('should read a bridge/state published as plain text', async () => {
    // PREPARE
    zigbee2mqttManager.zigbee2mqttConnected = false;
    zigbee2mqttManager.gladysConnected = true;
    zigbee2mqttManager.mqttClient = { publish: fake.returns(null) };
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', 'online');
    // ASSERT
    assert.calledOnceWithExactly(
      zigbee2mqttManager.mqttClient.publish,
      'zigbee2mqtt/bridge/request/health_check',
      '{}',
    );
  });

  it('should consider an unreadable bridge/state as offline', async () => {
    // PREPARE
    zigbee2mqttManager.zigbee2mqttConnected = true;
    zigbee2mqttManager.zigbee2mqttRunning = true;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', JSON.stringify({}));
    // ASSERT
    expect(zigbee2mqttManager.zigbee2mqttConnected).to.equal(false);
    expect(zigbee2mqttManager.zigbee2mqttRunning).to.equal(false);
  });

  it('should receive devices, exclude unsupported and coordinator', async () => {
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
    zigbee2mqttManager.syncRenamedDevices = fake.resolves(null);
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/devices', JSON.stringify(zigbeeDevices));
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.DISCOVER,
      payload: expectedDevicesPayload,
    });
    assert.calledOnce(zigbee2mqttManager.syncRenamedDevices);
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

  it('should get permit join from response/permit_join with time 254', async () => {
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage(
      'zigbee2mqtt/bridge/response/permit_join',
      `{"data":{"time":254},"status":"ok"}`,
    );
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: true,
    });
    expect(zigbee2mqttManager.z2mPermitJoin).to.equal(true);
  });

  it('should get permit join from response/permit_join with time 0', async () => {
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage(
      'zigbee2mqtt/bridge/response/permit_join',
      `{"data":{"time":0},"status":"ok"}`,
    );
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: false,
    });
    expect(zigbee2mqttManager.z2mPermitJoin).to.equal(false);
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
    // PREPARE
    const debugStub = sinon.stub(logger, 'debug');
    zigbee2mqttManager.gladys.stateManager.get = sinon.stub().returns(null);
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/anytopic/wrongtopic', `anymessage`);
    // ASSERT
    assert.calledOnceWithExactly(
      zigbee2mqttManager.gladys.stateManager.get,
      'deviceByExternalId',
      'zigbee2mqtt:anytopic/wrongtopic',
    );
    assert.calledOnceWithExactly(debugStub, 'Zigbee2mqtt topic zigbee2mqtt/anytopic/wrongtopic not handled.');
    assert.notCalled(gladys.event.emit);
    expect(zigbee2mqttManager.zigbee2mqttConnected).to.eq(true);
  });

  describe('device with "/" in its friendly name', () => {
    const lightDevice = {
      friendly_name: 'salon/lampe',
      supported: true,
      definition: {
        exposes: [
          {
            type: 'light',
            features: [
              {
                type: 'binary',
                name: 'state',
                property: 'state',
                value_on: 'ON',
                value_off: 'OFF',
              },
            ],
          },
        ],
      },
    };
    const gladysDevice = {
      external_id: 'zigbee2mqtt:salon/lampe',
      features: [
        {
          external_id: 'zigbee2mqtt:salon/lampe:light:binary:state',
          type: 'binary',
        },
      ],
    };

    beforeEach(() => {
      zigbee2mqttManager.discoveredDevices['salon/lampe'] = lightDevice;
      zigbee2mqttManager.gladys.stateManager.get = sinon.stub().returns(null);
      zigbee2mqttManager.gladys.stateManager.get
        .withArgs('deviceByExternalId', 'zigbee2mqtt:salon/lampe')
        .returns(gladysDevice);
    });

    it('should handle the state of a device whose name contains "/"', async () => {
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/salon/lampe', `{"state":"OFF","linkquality":120}`);
      // ASSERT
      assert.calledOnceWithExactly(gladys.event.emit, EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: 'zigbee2mqtt:salon/lampe:light:binary:state',
        state: 0,
      });
    });

    [
      ['zigbee2mqtt/salon/lampe/set', `{"state":"ON"}`],
      ['zigbee2mqtt/salon/lampe/get', `{"state":""}`],
      ['zigbee2mqtt/salon/lampe/availability', `{"state":"online"}`],
    ].forEach(([topic, message]) => {
      it(`should not mistake ${topic} for a device state`, async () => {
        // PREPARE
        const debugStub = sinon.stub(logger, 'debug');
        // EXECUTE
        await zigbee2mqttManager.handleMqttMessage(topic, message);
        // ASSERT
        assert.calledOnceWithExactly(
          zigbee2mqttManager.gladys.stateManager.get,
          'deviceByExternalId',
          `zigbee2mqtt:${topic.substring('zigbee2mqtt/'.length)}`,
        );
        assert.calledOnceWithExactly(debugStub, `Zigbee2mqtt topic ${topic} not handled.`);
        assert.notCalled(gladys.event.emit);
      });
    });

    it('should warn when the device is known by Zigbee2mqtt but not configured in Gladys', async () => {
      // PREPARE
      const warnStub = sinon.stub(logger, 'warn');
      zigbee2mqttManager.gladys.stateManager.get = sinon.stub().returns(null);
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/salon/lampe', `{"state":"OFF"}`);
      // ASSERT
      assert.calledOnceWithExactly(warnStub, 'Zigbee2mqtt device salon/lampe not configured in Gladys.');
      assert.notCalled(gladys.event.emit);
    });
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

  it('should parse firmware from bridge/info', async () => {
    // PREPARE
    const bridgeInfo = {
      coordinator: {
        type: 'EmberZNet',
        meta: {
          majorrel: 7,
          minorrel: 4,
          maintrel: 1,
          revision: 74100,
        },
      },
    };
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/info', JSON.stringify(bridgeInfo));
    // ASSERT
    expect(zigbee2mqttManager.coordinatorFirmware).to.deep.equal({
      majorrel: 7,
      minorrel: 4,
      maintrel: 1,
      revision: 74100,
      type: 'EmberZNet',
    });
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: {
        dockerBased: true,
        gladysConnected: false,
        mqttExist: false,
        mqttRunning: false,
        networkModeValid: true,
        usbConfigured: false,
        networkAdapterConfigured: false,
        z2mEnabled: false,
        zigbee2mqttConnected: true,
        zigbee2mqttStarting: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
        coordinatorFirmware: {
          majorrel: 7,
          minorrel: 4,
          maintrel: 1,
          revision: 74100,
          type: 'EmberZNet',
        },
        z2mContainerError: null,
        mqttConnectionError: null,
      },
    });
  });

  it('should handle bridge/info without coordinator meta gracefully', async () => {
    // PREPARE
    const bridgeInfo = {
      coordinator: {
        type: 'EmberZNet',
      },
    };
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/info', JSON.stringify(bridgeInfo));
    // ASSERT
    expect(zigbee2mqttManager.coordinatorFirmware).to.equal(null);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: sinon.match({
        coordinatorFirmware: null,
      }),
    });
  });
});
