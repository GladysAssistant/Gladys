const sinon = require('sinon');

const { fake, assert } = sinon;
const SonoffHandler = require('../../../../services/sonoff/lib');

const mqttService = {
  client: {
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

    assert.calledWith(mqttService.client.unsubscribe, 'stat/+/+');
    assert.calledWith(mqttService.client.unsubscribe, 'tele/+/+');
  });
});
