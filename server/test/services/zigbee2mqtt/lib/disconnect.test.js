const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

// Our own container, named after the requested filter
const ownContainer = (options) =>
  Promise.resolve([
    {
      id: 'docker-test',
      name: `/${options.filters.name[0]}`,
      labels: { 'io.gladysassistant.service': 'zigbee2mqtt' },
    },
  ]);

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const mqtt = {
  end: fake.resolves(true),
  removeAllListeners: fake.resolves(true),
};

describe('zigbee2mqtt disconnect', () => {
  // PREPARE
  let zigbee2MqttManager;
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
      system: {
        getContainers: fake(ownContainer),
        inspectContainer: fake.resolves({ Config: { Image: 'nginx:alpine' } }),
        stopContainer: fake.resolves(true),
        removeContainer: fake.resolves(true),
      },
    };

    zigbee2MqttManager = new Zigbee2mqttManager(gladys, mqtt, serviceId);
    zigbee2MqttManager.dockerBased = true;
    zigbee2MqttManager.networkModeValid = true;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('mqtt not connected', async () => {
    // EXECUTE
    await zigbee2MqttManager.disconnect();
    // ASSERT
    assert.calledThrice(gladys.event.emit);
    assert.alwaysCalledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
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
        zigbee2mqttConnected: false,
        zigbee2mqttStarting: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
        coordinatorFirmware: null,
        z2mContainerError: null,
        mqttConnectionError: null,
      },
    });
    assert.calledTwice(gladys.system.stopContainer);
    assert.calledTwice(gladys.system.removeContainer);
  });

  it('mqtt connected', async () => {
    // PREPARE
    zigbee2MqttManager.mqttClient = mqtt;
    // EXECUTE
    await zigbee2MqttManager.disconnect();
    // ASSERT
    assert.calledThrice(gladys.event.emit);
    assert.alwaysCalledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
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
        zigbee2mqttConnected: false,
        zigbee2mqttStarting: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
        coordinatorFirmware: null,
        z2mContainerError: null,
        mqttConnectionError: null,
      },
    });
    assert.calledTwice(gladys.system.stopContainer);
    assert.calledTwice(gladys.system.removeContainer);
    assert.calledOnce(mqtt.end);
    assert.calledOnce(mqtt.removeAllListeners);

    expect(zigbee2MqttManager.mqttClient).to.equal(null);
  });

  it('clear backup interval', async () => {
    // PREPARE
    zigbee2MqttManager.backupScheduledJob = {
      cancel: fake.returns(true),
    };
    // EXECUTE
    await zigbee2MqttManager.disconnect();
    // ASSERT
    assert.calledThrice(gladys.event.emit);
    assert.alwaysCalledWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
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
        zigbee2mqttConnected: false,
        zigbee2mqttStarting: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
        coordinatorFirmware: null,
        z2mContainerError: null,
        mqttConnectionError: null,
      },
    });
  });

  it('should end a pending startup and forget the removed containers', async () => {
    // PREPARE
    const clock = sinon.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const startingTimeout = fake();
    const healthCheckRetry = fake();
    zigbee2MqttManager.zigbee2mqttStarting = true;
    zigbee2MqttManager.startingTimer = setTimeout(startingTimeout, 1000);
    zigbee2MqttManager.healthCheckTimer = setTimeout(healthCheckRetry, 1000);
    zigbee2MqttManager.mqttExist = true;
    zigbee2MqttManager.zigbee2mqttExist = true;
    try {
      // EXECUTE
      await zigbee2MqttManager.disconnect();
      clock.tick(1000);
    } finally {
      clock.restore();
    }
    // ASSERT
    assert.notCalled(startingTimeout);
    assert.notCalled(healthCheckRetry);
    expect(zigbee2MqttManager.startingTimer).to.equal(null);
    expect(zigbee2MqttManager.healthCheckTimer).to.equal(null);
    expect(zigbee2MqttManager.zigbee2mqttStarting).to.equal(false);
    // Disabled, not "not responding": the banner of the discover page says that Zigbee2mqtt is not activated
    expect(zigbee2MqttManager.mqttExist).to.equal(false);
    expect(zigbee2MqttManager.zigbee2mqttExist).to.equal(false);
  });

  it('no container -> nothing to stop', async () => {
    // PREPARE
    gladys.system.getContainers = fake.resolves([]);
    // EXECUTE
    await zigbee2MqttManager.disconnect();
    // ASSERT
    assert.calledTwice(gladys.system.getContainers);
    assert.notCalled(gladys.system.stopContainer);
    assert.notCalled(gladys.system.removeContainer);
    expect(zigbee2MqttManager.mqttRunning).to.equal(false);
    expect(zigbee2MqttManager.zigbee2mqttRunning).to.equal(false);
  });

  it('our names are taken by user containers -> they are left untouched', async () => {
    // PREPARE
    gladys.system.getContainers = fake((options) =>
      Promise.resolve([{ id: 'user-container', name: `/${options.filters.name[0]}`, image: 'nginx:alpine' }]),
    );
    // EXECUTE
    await zigbee2MqttManager.disconnect();
    // ASSERT
    assert.calledTwice(gladys.system.inspectContainer);
    assert.notCalled(gladys.system.stopContainer);
    assert.notCalled(gladys.system.removeContainer);
    expect(zigbee2MqttManager.mqttRunning).to.equal(false);
    expect(zigbee2MqttManager.zigbee2mqttRunning).to.equal(false);
  });
});
