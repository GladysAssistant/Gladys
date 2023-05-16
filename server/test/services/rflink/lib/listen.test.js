const sinon = require('sinon');

const { ReadlineParserMock } = require('../SerialPortMock.test');
const RFLinkHandler = require('../../../../services/rflink/lib');

const { assert, stub } = sinon;

describe('RFLinkHandler.listen', () => {
  let rflinkHandler;
  let gladys;

  beforeEach(() => {
    gladys = {};
    rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    sinon.reset();
  });

  it('should listen', async () => {
    rflinkHandler.usb = { on: stub().resolves('data') };
    rflinkHandler.message = stub().returns(true);
    rflinkHandler.listen();
    assert.calledOnce(rflinkHandler.usb.on);
  });

  it('should store the message listened', async () => {
    rflinkHandler.usb = new ReadlineParserMock();
    rflinkHandler.message = stub().returns(true);
    rflinkHandler.listen();
    rflinkHandler.usb.emit('data');
    assert.calledOnce(rflinkHandler.message);
  });
});
