const sinon = require('sinon');

const { assert, fake } = sinon;
const BroadlinkHandler = require('../../../../../services/broadlink/lib');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

describe('broadlink.learn', () => {
  const gladys = {
    event: {
      emit: fake.returns(null),
    },
  };
  const broadlink = {};
  const serviceId = 'service-id';

  const broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

  let clock;
  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });
  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('learn unknown peripheral', () => {
    broadlinkHandler.learn('');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: 'no_peripheral',
      },
    });
  });

  it('learn not learnable peripheral', () => {
    const device = {};
    broadlinkHandler.broadlinkDevices = {
      '12ac': device,
    };

    broadlinkHandler.learn('12ac');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: 'error',
      },
    });
  });

  it('learn learnable peripheral', () => {
    const device = {
      learnCode: (cb) => {
        cb(null, 'any');
      },
    };
    broadlinkHandler.broadlinkDevices = {
      '12ac': device,
    };

    broadlinkHandler.learn('12ac');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: 'success',
        code: 'any',
      },
    });
  });
});
