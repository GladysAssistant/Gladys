const sinon = require('sinon');

const { assert, fake } = sinon;
const BroadlinkHandler = require('../../../../../services/broadlink/lib');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../../utils/constants');

describe('broadlink.send', () => {
  const broadlink = {};
  const serviceId = 'service-id';

  let gladys;
  let broadlinkHandler;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('send unknown peripheral', async () => {
    broadlinkHandler.getDevice = fake.rejects(null);

    await broadlinkHandler.send('', 'ad43');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.SEND_MODE,
      payload: {
        action: 'error',
      },
    });
  });

  it('sendable peripheral', async () => {
    const device = {
      sendData: fake.resolves(null),
    };
    broadlinkHandler.getDevice = fake.resolves(device);

    await broadlinkHandler.send('12ac', 'ad43');

    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BROADLINK.SEND_MODE,
      payload: {
        action: 'success',
      },
    });
    assert.calledWith(device.sendData, Buffer.from([0xad, 0x43]));
  });
});
