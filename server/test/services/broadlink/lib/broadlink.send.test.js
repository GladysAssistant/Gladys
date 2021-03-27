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

describe('BroadlinkHandler send', () => {
  const broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

  it('send unknown peripheral', () => {
    broadlinkHandler.send('', 'ad43');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.NO_PERIPHERAL,
      payload: {
        action: 'sendData',
      },
    });
  });

  it('not sendable peripheral', () => {
    const device = {};
    broadlinkHandler.broadlinkDevices = {
      '12ac': device,
    };

    broadlinkHandler.send('12ac', 'ad43');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.SEND_MODE_ERROR,
    });
  });

  it('sendable peripheral', () => {
    const device = {
      sendData: fake.returns(null),
    };
    broadlinkHandler.broadlinkDevices = {
      '12ac': device,
    };

    broadlinkHandler.send('12ac', 'ad43');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.SEND_MODE_SUCCESS,
    });
    assert.calledWith(device.sendData, Buffer.from([0xad, 0x43]));
  });
});
