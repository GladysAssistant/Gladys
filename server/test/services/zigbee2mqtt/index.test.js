const sinon = require('sinon');

const { assert, fake } = sinon;
const MockedMqttService = {
  device: {
    subscribe: fake.returns(null),
    unsubscribe: fake.returns(null),
  },
};

const Zigbee2mqttService = require('../../../services/zigbee2mqtt/index');

const gladys = {
  service: {
    getService: fake.returns(MockedMqttService),
  },
};

describe('Zigbee2mqttService', () => {
  beforeEach(() => {
    sinon.reset();
  });

  const zigbee2mqttService = Zigbee2mqttService(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  it('should start service', async () => {
    await zigbee2mqttService.start();
    assert.callCount(gladys.service.getService, 1);
    assert.calledOnce(MockedMqttService.device.subscribe);
  });

  it('should stop service', async () => {
    zigbee2mqttService.stop();
    assert.calledOnce(MockedMqttService.device.unsubscribe);
  });
});
