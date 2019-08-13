const sinon = require('sinon');

const { fake, assert } = sinon;
const SonoffHandler = require('../../../../services/sonoff/lib');

const mqttService = {
  client: {
    subscribe: fake.returns(null),
  },
};
const gladys = {
  service: {
    getService: fake.returns(mqttService),
  },
};

describe('SonoffHandler - connect', () => {
  const sonoffHandler = new SonoffHandler(gladys, 'service-uuid-random');
  sinon.spy(sonoffHandler, 'handleMqttMessage');

  beforeEach(() => {
    sinon.reset();
  });

  it('connect with subscription', () => {
    sonoffHandler.connect();

    assert.calledWith(gladys.service.getService, 'mqtt');
    assert.callCount(mqttService.client.subscribe, 2);
    mqttService.client.subscribe.firstCall.calledWith('stat/+/+', sonoffHandler.handleMqttMessage.bind(sonoffHandler));
    mqttService.client.subscribe.secondCall.calledWith('tele/+/+', sonoffHandler.handleMqttMessage.bind(sonoffHandler));
  });
});
