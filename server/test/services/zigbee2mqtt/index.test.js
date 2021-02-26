const { assert, fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const Zigbee2MqttService = proxyquire('../../../services/zigbee2mqtt', {});

const gladys = {};

describe('zigbee2mqtt service', () => {
  // PREPARE
  const zigbee2MqttService = Zigbee2MqttService(gladys, 'f87b7af2-ca8e-44fc-b754-444354b42fee');
  zigbee2MqttService.device.init = fake.resolves();
  zigbee2MqttService.device.disconnect = fake.resolves();
  it('should start service', async () => {
    // EXECUTE
    await zigbee2MqttService.start();
    // ASSERT
    assert.calledOnce(zigbee2MqttService.device.init);
  });
  it('should stop service', async () => {
    // EXECUTE
    await zigbee2MqttService.stop();
    // ASSERT
    assert.calledOnce(zigbee2MqttService.device.disconnect);
  });
});
