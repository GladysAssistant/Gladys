const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;
const { MockedMqttClient } = require('../mocks.test');

const { DEFAULT } = require('../../../../services/mqtt/lib/constants');
const MqttHandler = require('../../../../services/mqtt/lib');

describe('mqttHandler.init', () => {
  it('should init', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves('value'),
      },
      system: {
        isDocker: fake.resolves(false),
      },
    };

    const mqttHandler = new MqttHandler(gladys, MockedMqttClient, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    await mqttHandler.init();
    assert.callCount(gladys.variable.getValue, 3);
    expect(Object.keys(mqttHandler.topicBinds)).is.deep.eq(DEFAULT.TOPICS);
  });
});
