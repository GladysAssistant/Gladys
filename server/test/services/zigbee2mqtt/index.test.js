const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const Zigbee2MqttService = require('../../../services/zigbee2mqtt');

const gladys = {};

describe('zigbee2mqtt service', () => {
  // PREPARE
  let zigbee2MqttService;

  beforeEach(() => {
    zigbee2MqttService = Zigbee2MqttService(gladys, 'f87b7af2-ca8e-44fc-b754-444354b42fee');
    zigbee2MqttService.device.init = fake.resolves(null);
    zigbee2MqttService.device.disconnect = fake.resolves(null);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    // EXECUTE
    await zigbee2MqttService.start();
    // ASSERT
    assert.calledOnce(zigbee2MqttService.device.init);
    assert.notCalled(zigbee2MqttService.device.disconnect);
  });
  it('should stop service', async () => {
    // EXECUTE
    await zigbee2MqttService.stop();
    // ASSERT
    assert.calledOnce(zigbee2MqttService.device.disconnect);
    assert.notCalled(zigbee2MqttService.device.init);
  });
  it('should return if service is used', async () => {
    const used = await zigbee2MqttService.isUsed();
    expect(used).to.equal(false);
  });
});
