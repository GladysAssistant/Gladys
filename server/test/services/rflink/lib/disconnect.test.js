const sinon = require('sinon');
const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { assert, fake, stub } = sinon;
const { expect } = chai;

describe('RFLinkHandler.disconnect', () => {
  let rflinkHandler;
  let gladys;

  beforeEach(() => {
    gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    sinon.reset();
  });

  it('should disconnect by closing opened port and set right state of handler', async () => {
    rflinkHandler.Path = '/tty';
    rflinkHandler.connected = true;
    rflinkHandler.sendUsb = { close: stub().resolves(true) };
    await rflinkHandler.disconnect();
    assert.calledOnce(rflinkHandler.sendUsb.close);
    expect(rflinkHandler.connected).to.equal(false);
    expect(rflinkHandler.ready).to.equal(false);
    expect(rflinkHandler.scanInProgress).to.equal(false);
  });

  it('should set right state of handler and do nothing else since port is not opened', async () => {
    rflinkHandler.Path = '';
    rflinkHandler.connected = false;
    rflinkHandler.sendUsb = { close: stub().resolves(true) };
    await rflinkHandler.disconnect();
    assert.notCalled(rflinkHandler.sendUsb.close);
    expect(rflinkHandler.connected).to.equal(false);
    expect(rflinkHandler.ready).to.equal(false);
    expect(rflinkHandler.scanInProgress).to.equal(false);
  });
});
