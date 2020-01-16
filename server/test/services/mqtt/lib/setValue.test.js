const sinon = require('sinon');

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

describe('Mqtt setValue', () => {
  const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');

  beforeEach(async () => {
    sinon.reset();
  });

  it('publish new value', async () => {
    await mqttHandler.connect();
    const feature = {
      external_id: 'mqtt:my_feature',
    };
    mqttHandler.setValue(undefined, feature, 3);

    assert.calledWith(mqttApi.publish, 'gladys/my_feature/update', '3');
  });
});
