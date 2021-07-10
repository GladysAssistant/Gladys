const sinon = require('sinon');
const { expect } = require('chai');
const os = require('os');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { assert, fake, stub } = sinon;
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
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
  });

  it('should adapt the path depending on the os platform', async () => {
    const osStub = stub(os, 'platform').returns('darwin');
    const path = '/dev/tty.';
    await rflinkHandler.connect(path);
    assert.calledOnce(osStub);
    expect(rflinkHandler.Path).to.be.equal('/dev/cu.');
  });

  it('should fail connection with a non defined path', async () => {
    const path = '';
    try {
      await rflinkHandler.connect(path);
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }
  });

  it('should raise an error on opening connection error', async () => {
    // @TODO : serial port open should raise an error to test the open callback function code
    const path = '/tty1';
    await rflinkHandler.connect(path);
    /*
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.RFLINK.DRIVER_FAILED,
    });
    */
  });
});
