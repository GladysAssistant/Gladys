const { assert } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const Zigbee2MqttService = proxyquire('../../../../services/zigbee2mqtt', {});

const gladys = {};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt status', () => {
  // PREPARE
  const zigbee2MqttService = Zigbee2MqttService(gladys, serviceId);
  zigbee2MqttService.device.usbConfigured = 1;
  zigbee2MqttService.device.mqttExist = 2;
  zigbee2MqttService.device.mqttRunning = 3;
  zigbee2MqttService.device.zigbee2mqttExist = 4;
  zigbee2MqttService.device.zigbee2mqttRunning = 5;
  zigbee2MqttService.device.gladysConnected = 6;
  zigbee2MqttService.device.zigbee2mqttConnected = 7;
  zigbee2MqttService.device.z2mEnabled = 8;
  zigbee2MqttService.device.dockerBased = 9;
  zigbee2MqttService.device.networkModeValid = 10;

  it('get status', async () => {
    // EXECUTE
    const result = await zigbee2MqttService.device.status();
    // ASSERT
    assert.equal(result.usbConfigured, 1);
    assert.equal(result.mqttExist, 2);
    assert.equal(result.mqttRunning, 3);
    assert.equal(result.zigbee2mqttExist, 4);
    assert.equal(result.zigbee2mqttRunning, 5);
    assert.equal(result.gladysConnected, 6);
    assert.equal(result.zigbee2mqttConnected, 7);
    assert.equal(result.z2mEnabled, 8);
    assert.equal(result.dockerBased, 9);
    assert.equal(result.networkModeValid, 10);
  });
});
