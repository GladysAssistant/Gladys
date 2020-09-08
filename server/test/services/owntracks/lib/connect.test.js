const sinon = require('sinon');

const { fake, assert } = sinon;
const OwntracksHandler = require('../../../../services/owntracks/lib');

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

describe('OwntracksHandler - connect', () => {
  const owntracksHandler = new OwntracksHandler(gladys, 'service-uuid-random');
  sinon.spy(owntracksHandler, 'handleMqttMessage');

  beforeEach(() => {
    sinon.reset();
  });

  it('connect with subscription', () => {
    owntracksHandler.connect();

    assert.calledWith(gladys.service.getService, 'mqtt');
    assert.callCount(mqttService.device.subscribe, 2);
    mqttService.device.subscribe.firstCall.calledWith(
      'owntracks/+/+',
      owntracksHandler.handleMqttMessage.bind(owntracksHandler),
    );
  });
});
