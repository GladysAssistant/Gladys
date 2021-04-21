const sinon = require('sinon');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const Zigbee2MqttService = proxyquire('../../../../services/zigbee2mqtt', {});

const gladys = {};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

const mqtt = {
  publish: fake.resolves(true),
};

describe('zigbee2mqtt discoverDevices', () => {
  // PREPARE
  const zigbee2MqttService = Zigbee2MqttService(gladys, serviceId);
  zigbee2MqttService.device.mqttClient = mqtt;

  it('discover devices', async () => {
    // EXECUTE
    await zigbee2MqttService.device.discoverDevices();
    // ASSERT
    assert.calledWith(mqtt.publish, 'zigbee2mqtt/bridge/config/devices/get');
  });
});
