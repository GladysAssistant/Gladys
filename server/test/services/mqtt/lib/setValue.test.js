const sinon = require('sinon');
const assertChai = require('chai').assert;

const { assert, fake } = sinon;
const { MockedMqttClient, mqttApi } = require('../mocks.test');

const gladys = {
  variable: {
    getValue: fake.resolves('result'),
  },
  event: {
    emit: fake.returns(null),
  },
};

const MqttHandler = require('../../../../services/mqtt/lib');

describe('mqtt.setValue', () => {
  const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');

  beforeEach(async () => {
    sinon.reset();
  });

  it('should not publish, as not connected', async () => {
    const promise = mqttHandler.setValue({ external_id: 'my-device' }, { external_id: 'my-device-light' }, 1);

    await assertChai.isRejected(promise);
    assert.notCalled(mqttApi.publish);
  });

  it('should publish message', async () => {
    await mqttHandler.connect({ mqttUrl: 'url' });
    await mqttHandler.setValue({ external_id: 'my-device' }, { external_id: 'my-device-light' }, 1);

    assert.calledWith(
      mqttApi.publish,
      'gladys/device/my-device/feature/my-device-light/state',
      '1',
      undefined,
      sinon.match.func,
    );
  });
});
