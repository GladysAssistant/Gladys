const sinon = require('sinon');

const { fake, assert } = sinon;
const SonoffHandler = require('../../../../services/sonoff/lib');

const mqttService = {
  device: {
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
    assert.callCount(mqttService.device.subscribe, 2);
    mqttService.device.subscribe.firstCall.calledWith('stat/+/+', sonoffHandler.handleMqttMessage.bind(sonoffHandler));
    mqttService.device.subscribe.secondCall.calledWith('tele/+/+', sonoffHandler.handleMqttMessage.bind(sonoffHandler));
  });
});
