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
    zigbee2MqttManager.mqttExist = true;
    zigbee2MqttManager.mqttRunning = true;
    zigbee2MqttManager.zigbee2mqttExist = true;
    zigbee2MqttManager.zigbee2mqttRunning = true;
    zigbee2MqttManager.gladysConnected = false;
    zigbee2MqttManager.zigbee2mqttConnected = false;
    zigbee2MqttManager.dockerBased = false;
    zigbee2MqttManager.networkModeValid = false;
  });

  it('get status', async () => {
    // EXECUTE
    const result = await zigbee2MqttManager.status();
    // ASSERT
    expect(result.usbConfigured).that.equal(true);
    expect(result.mqttExist).that.equal(true);
    expect(result.mqttRunning).that.equal(true);
    expect(result.zigbee2mqttExist).that.equal(true);
    expect(result.zigbee2mqttRunning).that.equal(true);
    expect(result.gladysConnected).that.equal(false);
    expect(result.zigbee2mqttConnected).that.equal(false);
    expect(result.dockerBased).that.equal(false);
    expect(result.networkModeValid).that.equal(false);

    expect(result.z2mEnabled).that.equal(true);
  });
});
