const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const Zigbee2mqttManager = require('../../../../services/zigbee2mqtt/lib');

const container = {
  id: 'docker-test',
};

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
        // Return a container whose exact name matches whatever is queried
        getContainers: fake(async ({ filters }) => [{ ...container, name: `/${filters.name[0]}` }]),
        stopContainer: fake.resolves(true),
        removeContainer: fake.resolves(true),
      },
    };

    zigbee2MqttManager = new Zigbee2mqttManager(gladys, mqtt, serviceId);
    zigbee2MqttManager.dockerBased = true;
    zigbee2MqttManager.networkModeValid = true;
    // Container names resolved and persisted at init
    zigbee2MqttManager.getConfiguration = fake.resolves({
      mqttContainerName: 'gladys-z2m-mqtt',
      z2mContainerName: 'gladys-z2m-zigbee2mqtt',
    });
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
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
        coordinatorFirmware: null,
        z2mContainerError: null,
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
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
        coordinatorFirmware: null,
        z2mContainerError: null,
      },
    });
    assert.calledTwice(gladys.system.stopContainer);
    assert.calledTwice(gladys.system.removeContainer);
    assert.calledOnce(mqtt.end);
    assert.calledOnce(mqtt.removeAllListeners);

    expect(zigbee2MqttManager.mqttClient).to.equal(null);
  });

  it('should not touch any container when names were never persisted', async () => {
    // PREPARE - nothing was ever installed, so no name is persisted
    zigbee2MqttManager.getConfiguration = fake.resolves({
      mqttContainerName: undefined,
      z2mContainerName: undefined,
    });
    // EXECUTE
    await zigbee2MqttManager.disconnect();
    // ASSERT - a foreign homonym container must never be looked up, stopped or removed
    assert.notCalled(gladys.system.getContainers);
    assert.notCalled(gladys.system.stopContainer);
    assert.notCalled(gladys.system.removeContainer);
  });

  it('should look up but not stop anything when the persisted containers are already gone', async () => {
    // Names are persisted, but the containers no longer exist
    gladys.system.getContainers = fake.resolves([]);
    // EXECUTE
    await zigbee2MqttManager.disconnect();
    // ASSERT
    assert.calledTwice(gladys.system.getContainers);
    assert.notCalled(gladys.system.stopContainer);
    assert.notCalled(gladys.system.removeContainer);
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
        z2mEnabled: false,
        zigbee2mqttConnected: false,
        zigbee2mqttExist: false,
        zigbee2mqttRunning: false,
        coordinatorFirmware: null,
        z2mContainerError: null,
      },
    });
  });
});
