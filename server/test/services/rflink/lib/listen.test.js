const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { assert, stub } = sinon;

describe('RFLinkHandler.listen', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should listen', async () => {
    const gladys = {};
    const rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    rflinkHandler.usb = { on: stub().resolves('data'), };
    rflinkHandler.message = stub().returns(true);
    rflinkHandler.listen();
    assert.calledOnce(rflinkHandler.usb.on);
    // assert.calledOnce(rflinkHandler.message);
    // assert.calledWith(rflinkHandler.message, 'data');
  });
});
