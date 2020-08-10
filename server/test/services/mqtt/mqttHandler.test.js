const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const { MockedMqttClient } = require('./mocks.test');

const gladys = {
  variable: {
    getValue: fake.resolves('result'),
  },
  event: {
    emit: fake.returns(null),
  },
  system: {
    isDocker: fake.resolves(false),
  },
};

const MqttHandler = require('../../../services/mqtt/lib');

describe('MqttHandler', () => {
  let mqttHandler;

  beforeEach(() => {
    mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    sinon.reset();
  });

  it('should have falsy status', () => {
    expect(mqttHandler.configured).to.eq(false);
    expect(mqttHandler.connected).to.eq(false);
  });

  it('should have binded topics', async () => {
    await mqttHandler.init();

    expect(Object.keys(mqttHandler.topicBinds)).deep.eq(['gladys/master/#']);

    assert.callCount(gladys.variable.getValue, 3);
    assert.calledOnce(MockedMqttClient.internalConnect);
    expect(mqttHandler.configured).to.eq(true);
    expect(mqttHandler.connected).to.eq(false);
  });
});
