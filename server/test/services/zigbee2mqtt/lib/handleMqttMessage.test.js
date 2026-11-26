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

  [
    ['online', JSON.stringify({ state: 'online' })],
    ['offline', JSON.stringify({ state: 'offline' })],
    ['online as plain text, as older versions publish it', 'online'],
  ].forEach(([label, message]) => {
    it(`should check the health of Zigbee2mqtt when bridge/state announces it ${label}`, async () => {
      // PREPARE
      // The previous run had answered: its answer no longer proves anything for the new one
      zigbee2mqttManager.zigbee2mqttConnected = true;
      zigbee2mqttManager.zigbee2mqttRunning = true;
      zigbee2mqttManager.gladysConnected = true;
      zigbee2mqttManager.mqttClient = { publish: fake.returns(null) };
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', message);
      // ASSERT
      // bridge/state can be outdated, in both directions: Zigbee2mqtt is online only once it answers
      assert.calledWith(
        gladys.event.emit,
        EVENTS.WEBSOCKET.SEND_ALL,
        sinon.match.has('type', 'zigbee2mqtt.status-change'),
      );
      assert.calledOnce(zigbee2mqttManager.mqttClient.publish);
      assert.calledWith(zigbee2mqttManager.mqttClient.publish, 'zigbee2mqtt/bridge/request/health_check', '{}');
      expect(zigbee2mqttManager.zigbee2mqttConnected).to.equal(false);
      expect(zigbee2mqttManager.zigbee2mqttRunning).to.equal(false);
      // bridge/state is never mistaken for the state of a device
      assert.notCalled(gladys.stateManager.get);
    });
  });

  it('should not broadcast the status again when bridge/state finds Zigbee2mqtt already not answering', async () => {
    // PREPARE
    zigbee2mqttManager.zigbee2mqttConnected = false;
    zigbee2mqttManager.zigbee2mqttRunning = false;
    zigbee2mqttManager.gladysConnected = true;
    zigbee2mqttManager.mqttClient = { publish: fake.returns(null) };
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', JSON.stringify({ state: 'offline' }));
    // ASSERT
    assert.neverCalledWith(
      gladys.event.emit,
      EVENTS.WEBSOCKET.SEND_ALL,
      sinon.match.has('type', 'zigbee2mqtt.status-change'),
    );
    // Gladys still asks: the announcement means that the run changed
    assert.calledOnce(zigbee2mqttManager.mqttClient.publish);
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

    it('should keep asking while Zigbee2mqtt does not answer, less and less often, up to once a minute', async () => {
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', online);
      // ASSERT
      // One request right away, then after a delay doubled each time
      assert.calledOnce(zigbee2mqttManager.mqttClient.publish);
      [3000, 6000, 12000, 24000, 48000, 60000, 60000].forEach((delay, index) => {
        clock.tick(delay - 1);
        assert.callCount(zigbee2mqttManager.mqttClient.publish, index + 1);
        clock.tick(1);
        assert.callCount(zigbee2mqttManager.mqttClient.publish, index + 2);
      });
      expect(zigbee2mqttManager.zigbee2mqttConnected).to.equal(false);
    });

    it('should ask quickly again when Zigbee2mqtt announces a new run', async () => {
      // PREPARE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', online);
      clock.tick(45000);
      assert.callCount(zigbee2mqttManager.mqttClient.publish, 5);
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', online);
      clock.tick(3000);
      // ASSERT
      assert.callCount(zigbee2mqttManager.mqttClient.publish, 7);
    });

    it('should keep asking after an offline, which can come from the previous run after the new one started', async () => {
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', online);
      // The last will of the crashed previous run, published by the broker after the "online" of the new run
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', JSON.stringify({ state: 'offline' }));
      expect(zigbee2mqttManager.zigbee2mqttConnected).to.equal(false);
      clock.tick(3000);
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/response/health_check', healthy);
      clock.tick(60000);
      // ASSERT
      // One request for each announcement, one 3 seconds later, then none once Zigbee2mqtt answered
      assert.calledThrice(zigbee2mqttManager.mqttClient.publish);
      expect(zigbee2mqttManager.zigbee2mqttConnected).to.equal(true);
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
    zigbee2mqttManager.startingTimer = setTimeout(() => {}, 60000);
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
        configured: null,
        stopped: false,
        stoppedAt: null,
        setupPending: false,
        updatePending: false,
        serviceStarted: false,
        usbConfigured: false,
        dongleMissing: false,
        networkAdapterConfigured: false,
        z2mEnabled: true,
        zigbee2mqttConnected: true,
        zigbee2mqttStarting: false,
        zigbee2mqttExist: true,
        zigbee2mqttRunning: true,
        coordinatorFirmware: null,
        z2mVersion: null,
        deviceCount: null,
        z2mContainerError: null,
        ezspFallback: false,
        mqttConnectionError: null,
        installation: { state: 'idle', kind: null, phases: [], progress: 0, error: null, durationMs: null },
        prefetch: { state: 'idle', progress: 0, freeBytes: null, neededBytes: null, error: null },
      },
    });
    expect(zigbee2mqttManager.zigbee2mqttStarting).to.equal(false);
    expect(zigbee2mqttManager.startingTimer).to.equal(null);
  });

  it('should end the first setup once Zigbee2mqtt answers, the wizard no longer opened', async () => {
    // PREPARE
    gladys.variable = { destroy: fake.resolves(null) };
    zigbee2mqttManager.zigbee2mqttConnected = false;
    zigbee2mqttManager.setupPending = true;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/response/health_check', '{}');
    // ASSERT
    expect(zigbee2mqttManager.setupPending).to.equal(false);
    assert.calledOnceWithExactly(gladys.variable.destroy, 'Z2M_SETUP_PENDING', serviceId);
    assert.calledWithMatch(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, { payload: { setupPending: false } });
  });

  it('should only log the end of the first setup it could not save', async () => {
    // PREPARE
    const error = new Error('database locked');
    let logged;
    const warned = new Promise((resolve) => {
      logged = resolve;
    });
    gladys.variable = { destroy: fake.rejects(error) };
    sinon.stub(logger, 'warn').callsFake(() => logged());
    zigbee2mqttManager.setupPending = true;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/response/health_check', '{}');
    await warned;
    // ASSERT
    expect(zigbee2mqttManager.setupPending).to.equal(false);
    assert.calledOnceWithExactly(logger.warn, 'Zigbee2mqtt: end of the first setup not saved:', error);
  });

  it('should forget the failure of the last installation once Zigbee2mqtt answers, and tell the setup page', async () => {
    // PREPARE
    zigbee2mqttManager.emitInstallProgress = fake();
    zigbee2mqttManager.startInstallation('install');
    zigbee2mqttManager.finishInstallation(new Error('Zigbee2mqtt failed to start: NO_ANSWER'));
    zigbee2mqttManager.emitInstallProgress.resetHistory();
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/response/health_check', '{}');
    // ASSERT
    expect(zigbee2mqttManager.installation.state).to.equal('idle');
    assert.calledOnceWithExactly(zigbee2mqttManager.emitInstallProgress);
  });

  ['done', 'running'].forEach((state) => {
    it(`should keep an installation ${state} when Zigbee2mqtt answers`, async () => {
      // PREPARE
      zigbee2mqttManager.emitInstallProgress = fake();
      zigbee2mqttManager.startInstallation('install');
      if (state === 'done') {
        zigbee2mqttManager.finishInstallation(null);
      }
      const { installation } = zigbee2mqttManager;
      zigbee2mqttManager.emitInstallProgress.resetHistory();
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/response/health_check', '{}');
      // ASSERT
      expect(zigbee2mqttManager.installation).to.equal(installation);
      expect(installation.state).to.equal(state);
      assert.notCalled(zigbee2mqttManager.emitInstallProgress);
    });
  });

  it('should log how long Zigbee2mqtt took to answer after the restart of its container', async () => {
    // PREPARE
    const infoStub = sinon.stub(logger, 'info');
    zigbee2mqttManager.zigbee2mqttStarting = true;
    zigbee2mqttManager.zigbee2mqttStartingSince = Date.now() - 42000;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/response/health_check', '{}');
    // A later answer does not end a startup
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/response/health_check', '{}');
    // ASSERT
    assert.calledOnceWithExactly(
      infoStub,
      sinon.match(/^Zigbee2mqtt answered 42\.\d s after the restart of its container$/),
    );
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
    // An "offline" can come from the previous run of a container Gladys has just restarted: still starting
    expect(zigbee2mqttManager.zigbee2mqttStarting).to.equal(true);
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
    // The same number of devices as before: the status does not change
    zigbee2mqttManager.deviceCount = 7;
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

  it('should tell the number of devices in the network, unsupported ones included, coordinator excluded', async () => {
    // PREPARE
    zigbee2mqttManager.syncRenamedDevices = fake.resolves(null);
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/devices', JSON.stringify(zigbeeDevices));
    // ASSERT
    expect(zigbee2mqttManager.deviceCount).to.equal(7);
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: sinon.match({ deviceCount: 7 }),
    });
  });

  it('should forget the last values of the devices that left the network', async () => {
    // PREPARE
    zigbee2mqttManager.syncRenamedDevices = fake.resolves(null);
    const stillThere = { temperature: { value: 19.5, receivedAt: '2026-11-15T09:00:00.000Z' } };
    zigbee2mqttManager.lastReceivedStates = {
      '0x00158d00033e88d5': stillThere,
      '0x00158d0000000000': { temperature: { value: 21, receivedAt: '2026-11-15T09:00:00.000Z' } },
    };
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/devices', JSON.stringify(zigbeeDevices));
    // ASSERT
    expect(zigbee2mqttManager.lastReceivedStates).to.deep.equal({ '0x00158d00033e88d5': stillThere });
  });

  it('should keep a pairing name told while the device list was being handled', async () => {
    // PREPARE
    const ieeeAddress = '0x00124b0023a1b2c3';
    zigbee2mqttManager.handleBridgeEvent({
      type: 'device_joined',
      data: { ieee_address: ieeeAddress, friendly_name: ieeeAddress },
    });
    // A rename told by Zigbee2mqtt while Gladys re-attaches the renamed devices
    zigbee2mqttManager.syncRenamedDevices = fake(async () => {
      zigbee2mqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: { ieee_address: ieeeAddress, friendly_name: 'garden siren', status: 'started' },
      });
    });
    gladys.event.emit = fake();
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/devices', JSON.stringify(zigbeeDevices));
    // ASSERT
    expect(zigbee2mqttManager.pairingDevices[ieeeAddress].friendly_name).to.equal('garden siren');
    const pairingMessages = gladys.event.emit.args.filter(
      ([, message]) => message.type === WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PAIRING,
    );
    // The interview, then the registry once the list is handled
    expect(pairingMessages).to.have.lengthOf(2);
    expect(pairingMessages[1][1].payload[0].friendly_name).to.equal('garden siren');
  });

  it('should tell again a device that became ready while the device list was being handled', async () => {
    // PREPARE
    const ieeeAddress = '0x00158d00033e88d5';
    zigbee2mqttManager.handleBridgeEvent({
      type: 'device_interview',
      data: { ieee_address: ieeeAddress, friendly_name: ieeeAddress, status: 'started' },
    });
    // Its interview ends while Gladys re-attaches the renamed devices
    zigbee2mqttManager.syncRenamedDevices = fake(async () => {
      zigbee2mqttManager.handleBridgeEvent({
        type: 'device_interview',
        data: {
          ieee_address: ieeeAddress,
          friendly_name: ieeeAddress,
          status: 'successful',
          supported: true,
          definition: { model: 'WSDCGQ11LM', vendor: 'Xiaomi', description: 'Sensor' },
        },
      });
    });
    gladys.event.emit = fake();
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/devices', JSON.stringify(zigbeeDevices));
    // ASSERT
    const pairingMessages = gladys.event.emit.args.filter(
      ([, message]) => message.type === WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PAIRING,
    );
    // The end of the interview, then the registry once the Gladys devices are known
    expect(pairingMessages).to.have.lengthOf(2);
    expect(pairingMessages[1][1].payload[0].status).to.equal('ready');
  });

  it('should not tell the registry again when the device list changes nothing of it', async () => {
    // PREPARE
    zigbee2mqttManager.syncRenamedDevices = fake.resolves(null);
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/devices', JSON.stringify(zigbeeDevices));
    // ASSERT
    assert.neverCalledWith(
      gladys.event.emit,
      EVENTS.WEBSOCKET.SEND_ALL,
      sinon.match({
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PAIRING,
      }),
    );
  });

  it('should no longer read the legacy permit join topics of Zigbee2mqtt 1', async () => {
    // No Gladys device of that name
    gladys.stateManager.get = fake.returns(null);
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/config', `{"permit_join": true}`);
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/config/permit_join', `true`);
    // ASSERT
    expect(zigbee2mqttManager.z2mPermitJoin).to.equal(false);
    assert.neverCalledWithMatch(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
    });
  });

  it('should get permit join from response/permit_join with time 254, its end estimated', async () => {
    const clock = sinon.useFakeTimers(new Date('2026-11-20T10:00:00.000Z'));
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage(
      'zigbee2mqtt/bridge/response/permit_join',
      `{"data":{"time":254},"status":"ok"}`,
    );
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: { allowed: true, remainingSeconds: 254 },
    });
    expect(zigbee2mqttManager.z2mPermitJoin).to.equal(true);
    expect(zigbee2mqttManager.z2mPermitJoinEnd).to.equal(Date.now() + 254000);
    clock.restore();
  });

  it('should tell the answer of an Extend that changes nothing (Zigbee2mqtt 1, another clock)', async () => {
    const clock = sinon.useFakeTimers(new Date('2026-11-20T10:00:00.000Z'));
    await zigbee2mqttManager.handleMqttMessage(
      'zigbee2mqtt/bridge/response/permit_join',
      `{"data":{"time":254},"status":"ok"}`,
    );
    clock.tick(2000);
    gladys.event.emit = fake();
    // EXECUTE: within 5 s of the end known, no exact end follows
    await zigbee2mqttManager.handleMqttMessage(
      'zigbee2mqtt/bridge/response/permit_join',
      `{"data":{"time":254},"status":"ok"}`,
    );
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: { allowed: true, remainingSeconds: 252 },
    });
    clock.restore();
  });

  it('should get permit join from response/permit_join with time 0', async () => {
    zigbee2mqttManager.z2mPermitJoin = true;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage(
      'zigbee2mqtt/bridge/response/permit_join',
      `{"data":{"time":0},"status":"ok"}`,
    );
    // ASSERT
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: { allowed: false, remainingSeconds: null },
    });
    expect(zigbee2mqttManager.z2mPermitJoin).to.equal(false);
  });

  it('should not change permit join on a refused response/permit_join', async () => {
    zigbee2mqttManager.z2mPermitJoin = true;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage(
      'zigbee2mqtt/bridge/response/permit_join',
      `{"data":{},"status":"error","error":"Device 'bulb' does not exist"}`,
    );
    // ASSERT
    expect(zigbee2mqttManager.z2mPermitJoin).to.equal(true);
    assert.notCalled(gladys.event.emit);
  });

  it('should not change permit join on a response/permit_join that tells nothing', async () => {
    zigbee2mqttManager.z2mPermitJoin = true;
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/response/permit_join', `{"status":"ok"}`);
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/response/permit_join', `{"data":{},"status":"ok"}`);
    // ASSERT
    expect(zigbee2mqttManager.z2mPermitJoin).to.equal(true);
    assert.notCalled(gladys.event.emit);
  });

  it('should read the value of a response/permit_join of Zigbee2mqtt 1 asked without time', async () => {
    // EXECUTE: asked by another client
    await zigbee2mqttManager.handleMqttMessage(
      'zigbee2mqtt/bridge/response/permit_join',
      `{"data":{"value":true},"status":"ok"}`,
    );
    // ASSERT: open, its end unknown
    expect(zigbee2mqttManager.z2mPermitJoin).to.equal(true);
    expect(zigbee2mqttManager.z2mPermitJoinEnd).to.equal(null);
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage(
      'zigbee2mqtt/bridge/response/permit_join',
      `{"data":{"value":false},"status":"ok"}`,
    );
    // ASSERT
    expect(zigbee2mqttManager.z2mPermitJoin).to.equal(false);
  });

  it('should keep the exact end told by bridge/info before the response/permit_join', async () => {
    const clock = sinon.useFakeTimers(new Date('2026-11-20T10:00:00.000Z'));
    const end = Date.now() + 253600;
    // EXECUTE: as Zigbee2mqtt 2 publishes them
    await zigbee2mqttManager.handleMqttMessage(
      'zigbee2mqtt/bridge/info',
      JSON.stringify({ version: '2.14.2', permit_join: true, permit_join_end: end }),
    );
    clock.tick(300);
    await zigbee2mqttManager.handleMqttMessage(
      'zigbee2mqtt/bridge/response/permit_join',
      `{"data":{"time":254},"status":"ok"}`,
    );
    // ASSERT
    expect(zigbee2mqttManager.z2mPermitJoinEnd).to.equal(end);
    expect(zigbee2mqttManager.lastPermitJoinEnd).to.equal(end);
    clock.restore();
  });

  it('should follow a device joining from bridge/event', async () => {
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage(
      'zigbee2mqtt/bridge/event',
      JSON.stringify({ type: 'device_joined', data: { friendly_name: '0x01', ieee_address: '0x01' } }),
    );
    // ASSERT
    expect(zigbee2mqttManager.pairingDevices['0x01'].status).to.equal('joined');
    assert.calledWithMatch(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PAIRING,
    });
  });

  it('should keep joining and the devices seen joining when the bridge state is told again', async () => {
    const end = Date.now() + 10000;
    zigbee2mqttManager.z2mPermitJoin = true;
    zigbee2mqttManager.z2mPermitJoinEnd = end;
    zigbee2mqttManager.pairingDevices = { '0x01': { ieee_address: '0x01', status: 'joined' } };
    zigbee2mqttManager.requestHealthCheck = fake();
    // EXECUTE: the retained announcement, replayed when Gladys connects to the broker again
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/state', 'online');
    // ASSERT
    expect(zigbee2mqttManager.z2mPermitJoin).to.equal(true);
    expect(zigbee2mqttManager.z2mPermitJoinEnd).to.equal(end);
    expect(zigbee2mqttManager.pairingDevices).to.have.property('0x01');
    assert.neverCalledWithMatch(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
    });
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
      ieee_address: '0x0017880104e45517',
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

    describe('last values received', () => {
      let clock;

      beforeEach(() => {
        clock = sinon.useFakeTimers(new Date('2026-11-15T09:00:00.000Z'));
      });

      afterEach(() => {
        clock.restore();
      });

      it('should keep the last value of each property of a device not configured in Gladys, with its date', async () => {
        // PREPARE
        zigbee2mqttManager.gladys.stateManager.get = sinon.stub().returns(null);
        // EXECUTE
        await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/salon/lampe', `{"state":"OFF","linkquality":120}`);
        clock.tick(60 * 1000);
        await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/salon/lampe', `{"linkquality":90}`);
        // ASSERT
        expect(zigbee2mqttManager.lastReceivedStates).to.deep.equal({
          '0x0017880104e45517': {
            state: { value: 'OFF', receivedAt: '2026-11-15T09:00:00.000Z' },
            linkquality: { value: 90, receivedAt: '2026-11-15T09:01:00.000Z' },
          },
        });
      });

      it('should not keep the values of a device configured in Gladys, as they are saved right away', async () => {
        // EXECUTE
        await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/salon/lampe', `{"state":"ON"}`);
        // ASSERT
        assert.calledOnce(gladys.event.emit);
        expect(zigbee2mqttManager.lastReceivedStates).to.deep.equal({});
      });

      ['not json', 'null', '"ON"', '[{"state":"ON"}]'].forEach((message) => {
        it(`should ignore a message that is not a state: ${message}`, async () => {
          // PREPARE
          const warnStub = sinon.stub(logger, 'warn');
          // EXECUTE
          await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/salon/lampe', message);
          // ASSERT
          assert.calledOnceWithExactly(
            warnStub,
            `Zigbee2mqtt device salon/lampe sent a message that is not a state: ${message}`,
          );
          assert.notCalled(gladys.event.emit);
          expect(zigbee2mqttManager.lastReceivedStates).to.deep.equal({});
        });
      });

      it('should not keep the values of a device unknown by Zigbee2mqtt', async () => {
        // PREPARE
        zigbee2mqttManager.gladys.stateManager.get = sinon.stub().returns(null);
        // EXECUTE
        await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/salon/lampe/availability', `{"state":"online"}`);
        // ASSERT
        expect(zigbee2mqttManager.lastReceivedStates).to.deep.equal({});
      });
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
      version: '2.14.2',
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
        configured: null,
        stopped: false,
        stoppedAt: null,
        setupPending: false,
        updatePending: false,
        serviceStarted: false,
        usbConfigured: false,
        dongleMissing: false,
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
        z2mVersion: '2.14.2',
        deviceCount: null,
        z2mContainerError: null,
        ezspFallback: false,
        mqttConnectionError: null,
        installation: { state: 'idle', kind: null, phases: [], progress: 0, error: null, durationMs: null },
        prefetch: { state: 'idle', progress: 0, freeBytes: null, neededBytes: null, error: null },
      },
    });
  });

  it('should tell the joining Zigbee2mqtt closed, from its info', async () => {
    zigbee2mqttManager.z2mPermitJoin = true;
    await zigbee2mqttManager.handleMqttMessage(
      'zigbee2mqtt/bridge/info',
      JSON.stringify({ version: '2.14.2', permit_join: false }),
    );
    expect(zigbee2mqttManager.z2mPermitJoin).to.equal(false);
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: { allowed: false, remainingSeconds: null },
    });
  });

  it('should tell the joining Zigbee2mqtt opened and its end, from its info', async () => {
    const clock = sinon.useFakeTimers(new Date('2026-11-20T10:00:00.000Z'));
    await zigbee2mqttManager.handleMqttMessage(
      'zigbee2mqtt/bridge/info',
      JSON.stringify({ version: '2.14.2', permit_join: true, permit_join_end: Date.now() + 200000 }),
    );
    expect(zigbee2mqttManager.z2mPermitJoinEnd).to.equal(Date.now() + 200000);
    assert.calledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
      payload: { allowed: true, remainingSeconds: 200 },
    });
    clock.restore();
  });

  it('should not tell the joining again when the info of Zigbee2mqtt does not change it', async () => {
    zigbee2mqttManager.z2mPermitJoin = false;
    await zigbee2mqttManager.handleMqttMessage(
      'zigbee2mqtt/bridge/info',
      JSON.stringify({ version: '2.14.2', permit_join: false }),
    );
    assert.neverCalledWithMatch(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.PERMIT_JOIN,
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
    expect(zigbee2mqttManager.z2mVersion).to.equal(null);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.STATUS_CHANGE,
      payload: sinon.match({
        coordinatorFirmware: null,
        z2mVersion: null,
      }),
    });
  });

  it('should warn that a Zigbee2mqtt older than 1.21 does not answer the health check', async () => {
    // PREPARE
    const warnStub = sinon.stub(logger, 'warn');
    // EXECUTE
    await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/info', JSON.stringify({ version: '1.20.0' }));
    // ASSERT
    assert.calledOnceWithExactly(
      warnStub,
      'Zigbee2mqtt 1.20.0 does not answer the health check, Gladys needs Zigbee2mqtt 1.21 or later',
    );
  });

  ['2.14.2', '2.1.0-dev'].forEach((version) => {
    it(`should keep the version ${version} of Zigbee2mqtt`, async () => {
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/info', JSON.stringify({ version }));
      // ASSERT
      expect(zigbee2mqttManager.z2mVersion).to.equal(version);
    });
  });

  ['1.0<iframe src="javascript:alert(1)">', '1.0.0<b>', 'latest', 2, undefined].forEach((version) => {
    it(`should not keep ${JSON.stringify(version)} as the version of Zigbee2mqtt`, async () => {
      // PREPARE
      zigbee2mqttManager.z2mVersion = '2.14.2';
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/info', JSON.stringify({ version }));
      // ASSERT
      expect(zigbee2mqttManager.z2mVersion).to.equal(null);
    });
  });

  ['1.21.0', '2.14.2', '2.1.0-dev', undefined].forEach((version) => {
    it(`should not warn about the version of Zigbee2mqtt ${version}`, async () => {
      // PREPARE
      const warnStub = sinon.stub(logger, 'warn');
      // EXECUTE
      await zigbee2mqttManager.handleMqttMessage('zigbee2mqtt/bridge/info', JSON.stringify({ version }));
      // ASSERT
      assert.notCalled(warnStub);
    });
  });
});
