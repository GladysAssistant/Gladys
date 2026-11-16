const { expect } = require('chai');

const Zigbee2MqttManager = require('../../../../services/zigbee2mqtt/lib');

const gladys = {
  job: {
    wrapper: (type, func) => {
      return async () => {
        return func();
      };
    },
  },
};
const mqtt = {};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt status', () => {
  // PREPARE
  let zigbee2MqttManager;

  beforeEach(() => {
    zigbee2MqttManager = new Zigbee2MqttManager(gladys, mqtt, serviceId);
    zigbee2MqttManager.usbConfigured = true;
    zigbee2MqttManager.networkAdapterConfigured = false;
    zigbee2MqttManager.mqttExist = true;
    zigbee2MqttManager.mqttRunning = true;
    zigbee2MqttManager.zigbee2mqttExist = true;
    zigbee2MqttManager.zigbee2mqttRunning = true;
    zigbee2MqttManager.gladysConnected = false;
    zigbee2MqttManager.zigbee2mqttConnected = false;
    zigbee2MqttManager.zigbee2mqttStarting = true;
    zigbee2MqttManager.dockerBased = false;
    zigbee2MqttManager.networkModeValid = false;
  });

  it('get status', async () => {
    // EXECUTE
    const result = await zigbee2MqttManager.status();
    // ASSERT
    expect(result.usbConfigured).that.equal(true);
    expect(result.networkAdapterConfigured).that.equal(false);
    expect(result.mqttExist).that.equal(true);
    expect(result.mqttRunning).that.equal(true);
    expect(result.zigbee2mqttExist).that.equal(true);
    expect(result.zigbee2mqttRunning).that.equal(true);
    expect(result.gladysConnected).that.equal(false);
    expect(result.zigbee2mqttConnected).that.equal(false);
    expect(result.zigbee2mqttStarting).that.equal(true);
    expect(result.dockerBased).that.equal(false);
    expect(result.networkModeValid).that.equal(false);

    expect(result.z2mEnabled).that.equal(true);
    expect(result.coordinatorFirmware).that.equal(null);
    expect(result.z2mContainerError).that.equal(null);
    expect(result.ezspFallback).that.equal(false);
    expect(result.mqttConnectionError).that.equal(null);
    expect(result.installation).to.deep.equal({
      state: 'idle',
      kind: null,
      phases: [],
      progress: 0,
      error: null,
      durationMs: null,
    });
    expect(result.prefetch).to.deep.equal({
      state: 'idle',
      progress: 0,
      freeBytes: null,
      neededBytes: null,
      error: null,
    });
  });

  it('should give the installation being followed', async () => {
    // PREPARE
    const installation = { state: 'running', kind: 'switch', phases: [], progress: 42, error: null, durationMs: null };
    zigbee2MqttManager.installation = installation;
    // EXECUTE
    const result = await zigbee2MqttManager.status();
    // ASSERT
    expect(result.installation).to.equal(installation);
  });

  it('should show Zigbee2mqtt enabled while its container exists, even when it does not answer', async () => {
    // PREPARE
    // Crashing in a loop: the user must still be able to turn it off
    zigbee2MqttManager.zigbee2mqttRunning = false;
    // EXECUTE
    const result = await zigbee2MqttManager.status();
    // ASSERT
    expect(result.z2mEnabled).that.equal(true);
  });

  it('should show Zigbee2mqtt enabled while Gladys uses an external broker, even when it does not answer', async () => {
    // PREPARE
    zigbee2MqttManager.mqttExist = false;
    zigbee2MqttManager.mqttRunning = false;
    zigbee2MqttManager.zigbee2mqttExist = false;
    zigbee2MqttManager.zigbee2mqttRunning = false;
    zigbee2MqttManager.mqttClient = {};
    // EXECUTE
    const result = await zigbee2MqttManager.status();
    // ASSERT
    expect(result.z2mEnabled).that.equal(true);
  });

  it('should show Zigbee2mqtt disabled without container nor MQTT client', async () => {
    // PREPARE
    zigbee2MqttManager.zigbee2mqttExist = false;
    // EXECUTE
    const result = await zigbee2MqttManager.status();
    // ASSERT
    expect(result.z2mEnabled).that.equal(false);
  });
});
