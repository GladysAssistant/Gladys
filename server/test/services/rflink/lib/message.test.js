const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { assert, fake } = sinon;
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

describe('RFLinkHandler.message', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should get a message from the RFLink with success', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    const msgRF = 'rfmsg';

    const rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    await rflinkHandler.message(msgRF);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.RFLINK.NEW_MESSAGE,
    });
  });

});
