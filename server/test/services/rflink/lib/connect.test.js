const sinon = require('sinon');
const { expect } = require('chai');
const os = require('os');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { assert, fake, stub } = sinon;
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

let rflinkHandler;
let gladys;

describe('RFLinkHandler.connect', () => {
  gladys = {
    event: {
      emit: fake.returns(null),
    },
  };
  rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  beforeEach(() => {
    sinon.reset();
  });

  it('should connect and receive success', async () => {
    const path = '/tty1';
    await rflinkHandler.connect(path);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.RFLINK.DRIVER_READY,
    });
    expect(rflinkHandler.Path).to.be.equal('/tty1');
    expect(rflinkHandler.connected).to.be.equal(true);
    expect(rflinkHandler.ready).to.be.equal(true);
    expect(rflinkHandler.scanInProgress).to.be.equal(true);
  });

  it('should adapt the path depending on the os platform', async () => {
    const osStub = stub(os, 'platform').returns('darwin');
    const path = '/dev/tty.';
    await rflinkHandler.connect(path);
    assert.calledOnce(osStub);
    expect(rflinkHandler.Path).to.be.equal('/dev/cu.');
  });

  it('should fail connection with a non defined path', async () => {
    rflinkHandler.listen = stub();
    const path = '';
    try {
      await rflinkHandler.connect(path);
      assert.fail();
    } catch (e) {
      assert.match(e.message, 'RFLINK_PATH_NOT_FOUND');
    }
    assert.notCalled(rflinkHandler.listen);
    expect(rflinkHandler.connected).to.be.equal(false);
    expect(rflinkHandler.ready).to.be.equal(false);
    expect(rflinkHandler.scanInProgress).to.be.equal(false);
  });
});
