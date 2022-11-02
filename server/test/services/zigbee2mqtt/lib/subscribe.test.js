const sinon = require('sinon');

const { assert, fake } = sinon;
const { expect } = require('chai');

const Zigbee2MqttManager = require('../../../../services/zigbee2mqtt/lib');

const gladys = {
  job: {
    wrapper: (type, func) => {
      return async () => {
        return func();
      };
    },
  },
};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('zigbee2mqtt subscribe', () => {
  // PREPARE
  let zigbee2MqttManager;
  let mqtt;

  beforeEach(() => {
    mqtt = {
      subscribe: fake.resolves(true),
    };

    zigbee2MqttManager = new Zigbee2MqttManager(gladys, {}, serviceId);
    zigbee2MqttManager.topicBinds = [];
  });

  afterEach(() => {
    sinon.reset();
  });

  it('subscribe ', async () => {
    // PREPRARE
    zigbee2MqttManager.mqttClient = mqtt;
    // EXECUTE
    await zigbee2MqttManager.subscribe('topic', 'callback');
    // ASSERT
    assert.calledWith(mqtt.subscribe, 'topic');
    expect(zigbee2MqttManager.topicBinds.topic).to.equal('callback');
  });

  it('subscribe without mqtt', async () => {
    // EXECUTE
    await zigbee2MqttManager.subscribe('topic', 'callback');
    // ASSERT
    assert.notCalled(mqtt.subscribe);
    expect(zigbee2MqttManager.topicBinds.topic).to.equal('callback');
  });
});
