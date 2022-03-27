const sinon = require('sinon');

const { assert, fake } = sinon;

const BroadlinkHandler = require('../../../../../services/broadlink/lib');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

describe('broadlink.cancelLearn', () => {
  const gladys = {
    event: {
      emit: fake.returns(null),
    },
  };
  const broadlink = {};
  const serviceId = 'service-id';
  const broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

  afterEach(() => {
    sinon.reset();
  });

  it('cancelLearn unknown peripheral', () => {
    broadlinkHandler.cancelLearn('');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: 'no_peripheral',
      },
    });
  });

  it('cancelLearn not learnable peripheral', () => {
    const device = {};
    broadlinkHandler.broadlinkDevices = {
      '12ac': device,
    };

    broadlinkHandler.cancelLearn('12ac');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: 'cancel_error',
      },
    });
  });

  it('cancelLearn not learning peripheral', () => {
    const device = {
      cancelLearnCode: fake.returns(null),
    };
    broadlinkHandler.broadlinkDevices = {
      '12ac': device,
    };

    broadlinkHandler.cancelLearn('12ac');

    assert.notCalled(gladys.event.emit);
    assert.notCalled(device.cancelLearnCode);
  });

  it('cancelLearn learning peripheral', () => {
    const device = {
      cancelLearnCode: fake.returns(null),
      learning: true,
    };
    broadlinkHandler.broadlinkDevices = {
      '12ac': device,
    };

    broadlinkHandler.cancelLearn('12ac');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.LEARN_MODE,
      payload: {
        action: 'cancel_success',
      },
    });
    assert.calledOnce(device.cancelLearnCode);
  });
});
