const sinon = require('sinon');

const { fake, assert } = sinon;
const OwntracksHandler = require('../../../../services/owntracks/lib');

const mqttService = {
  device: {
    unsubscribe: fake.returns(null),
  },
};

describe('OwntracksHandler - disconnect', () => {
  const owntracksHandler = new OwntracksHandler({}, 'service-uuid-random');
  owntracksHandler.mqttService = mqttService;

  beforeEach(() => {
    sinon.reset();
  });

  it('disconnect with unsubscription', () => {
    owntracksHandler.disconnect();

    assert.calledWith(mqttService.device.unsubscribe, 'owntracks/+/+');
  });
});
