const sinon = require('sinon');
const { expect } = require('chai');

const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { assert, fake } = sinon;
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

describe('RFLinkHandler.connect', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should connect and receive success', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    const path = '/tty1';

    const rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    await rflinkHandler.connect(path);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.RFLINK.DRIVER_READY,
    });
  });


  it('should fail connection', async () => {
    const gladys = {
      event:  fake.returns(null),
    };
    const path = '';

    const rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    await rflinkHandler.connect(path);

    try {
      await rflinkHandler.connect(path);
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }
  });

});
