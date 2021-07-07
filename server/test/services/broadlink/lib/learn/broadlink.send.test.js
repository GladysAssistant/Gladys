const sinon = require('sinon');

const { assert, fake } = sinon;
const BroadlinkHandler = require('../../../../../services/broadlink/lib');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

describe('broadlink.send', () => {
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

  it('send unknown peripheral', () => {
    broadlinkHandler.send('', 'ad43');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.SEND_MODE,
      payload: {
        action: 'error',
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
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.SEND_MODE,
      payload: {
        action: 'error',
      },
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
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.SEND_MODE,
      payload: {
        action: 'success',
      },
    });
    assert.calledWith(device.sendData, Buffer.from([0xad, 0x43]));
  });
});
