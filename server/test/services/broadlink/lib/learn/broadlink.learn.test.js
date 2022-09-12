const sinon = require('sinon');

const { assert, fake } = sinon;
const BroadlinkHandler = require('../../../../../services/broadlink/lib');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

describe('broadlink.learn', () => {
  const serviceId = 'service-id';

  let broadlink;
  let gladys;
  let broadlinkHandler;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    broadlink = {};
    broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('learn unknown peripheral', async () => {
    broadlinkHandler.getDevice = fake.rejects(null);

    await broadlinkHandler.learn('');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: 'no_peripheral',
      },
    });
  });

  it('learn not learnable peripheral', async () => {
    const device = {};
    broadlinkHandler.getDevice = fake.resolves(device);

    await broadlinkHandler.learn('12ac');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: 'error',
      },
    });
  });

  it('learn learnable peripheral', async () => {
    const device = {
      enterLearning: fake.resolves(null),
    };
    broadlinkHandler.getDevice = fake.resolves(device);
    broadlinkHandler.checkData = fake.resolves(device);

    await broadlinkHandler.learn('12ac');

    assert.calledOnce(broadlinkHandler.checkData);
  });
});
