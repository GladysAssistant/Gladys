const { assert, fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { MockedMqttClient } = require('./mocks.test');

const MqttService = proxyquire('../../../services/mqtt/index', {
  mqtt: MockedMqttClient,
});

const gladys = {
  variable: {
    getValue: fake.resolves('result'),
  },
};

describe('MqttService', () => {
  const mqttService = MqttService(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  it('should start service', async () => {
    await mqttService.start();
    assert.called(MockedMqttClient.connect);
  });
});
