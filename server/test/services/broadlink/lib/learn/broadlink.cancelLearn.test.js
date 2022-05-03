const sinon = require('sinon');

const { assert, fake } = sinon;

const BroadlinkHandler = require('../../../../../services/broadlink/lib');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

describe('broadlink.cancelLearn', () => {
  const serviceId = 'service-id';

  let gladys;
  let broadlink;
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

  it('cancelLearn unknown peripheral', async () => {
    broadlinkHandler.getDevice = fake.rejects(null);

    await broadlinkHandler.cancelLearn('');

    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: 'no_peripheral',
      },
    });
  });

  it('cancelLearn not learning peripheral', async () => {
    const device = {
      cancelLearning: fake.rejects(null),
    };
    broadlinkHandler.getDevice = fake.resolves(device);

    await broadlinkHandler.cancelLearn('12ac');

    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: 'cancel_error',
      },
    });
    assert.calledOnceWithExactly(device.cancelLearning);
  });

  it('cancelLearn learning peripheral', async () => {
    const device = {
      cancelLearning: fake.resolves(null),
    };
    broadlinkHandler.getDevice = fake.resolves(device);

    await broadlinkHandler.cancelLearn('12ac');

    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: 'cancel_success',
      },
    });
    assert.calledOnceWithExactly(device.cancelLearning);
  });
});
