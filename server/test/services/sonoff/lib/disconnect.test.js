const sinon = require('sinon');

const { fake, assert } = sinon;
const SonoffHandler = require('../../../../services/sonoff/lib');

const mqttService = {
  device: {
    unsubscribe: fake.returns(null),
  },
};

describe('SonoffHandler - disconnect', () => {
  const sonoffHandler = new SonoffHandler({}, 'service-uuid-random');
  sonoffHandler.mqttService = mqttService;

  beforeEach(() => {
    sinon.reset();
  });

  it('disconnect with unsubscription', () => {
    sonoffHandler.disconnect();

    assert.calledWith(mqttService.device.unsubscribe, 'stat/+/+');
    assert.calledWith(mqttService.device.unsubscribe, 'tele/+/+');
  });
});
