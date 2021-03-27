const sinon = require('sinon');

const { assert, fake } = sinon;
const BroadlinkHandler = require('../../../../services/broadlink/lib');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const broadlink = {};
const serviceId = 'service-id';

describe('BroadlinkHandler cancelLearn', () => {
  const broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

  it('cancelLearn unknown peripheral', () => {
    broadlinkHandler.cancelLearn('');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.NO_PERIPHERAL,
      payload: {
        action: 'learnMode',
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
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.CANCEL_LEARN_MODE_ERROR,
    });
  });

  it('cancelLearn learnable peripheral', () => {
    const device = {
      cancelLearnCode: fake.returns(null),
    };
    broadlinkHandler.broadlinkDevices = {
      '12ac': device,
    };

    broadlinkHandler.cancelLearn('12ac');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.CANCEL_LEARN_MODE_SUCCESS,
    });
    assert.calledOnce(device.cancelLearnCode);
  });
});
