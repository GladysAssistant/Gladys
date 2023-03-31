const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const Zigbee2MqttService = require('../../../services/zigbee2mqtt');

const gladys = {
  event: {
    emit: fake.returns,
  },
  job: {
    wrapper: (type, func) => {
      return async () => {
        return func();
      };
    },
  },
};

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
  it('isUsed: should return false, service not used', async () => {
    const used = await zigbee2MqttService.isUsed();
    expect(used).to.equal(false);
  });
  it('isUsed: should return true, service is used', async () => {
    zigbee2MqttService.device.gladysConnected = true;
    // handle one message so that zigbee2mqtt connected is true
    await zigbee2MqttService.device.handleMqttMessage('zigbee2mqtt/bridge/devices', JSON.stringify([]));
    const used = await zigbee2MqttService.isUsed();
    expect(used).to.equal(true);
  });
});
