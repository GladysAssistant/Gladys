const sinon = require('sinon');
const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const { assert, fake } = sinon;
const { expect } = chai;

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

describe('RFLinkHandler.addDevice', () => {
  let rflinkHandler;
  let gladys;
  const event = { emit: fake.returns(null) };
  beforeEach(() => {
    sinon.reset();
    gladys = { event };
    rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
  });

  it('should add new devices', async () => {
    const device = 'device';
    rflinkHandler.addNewDevice(device);
    assert.calledOnce(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.RFLINK.NEW_DEVICE,
    });
    expect(rflinkHandler.newDevices)
      .to.be.an('array')
      .that.includes(device);
  });

  it('should not add new devices because something went wrong', async () => {
    gladys = {
      event: {
        emit: fake.throws('unknown error', 'This an unknown error'),
      },
    };
    rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    const device = 'device';
    rflinkHandler.addNewDevice(device);
    assert.calledOnce(gladys.event.emit);
    // @todo test logger
  });
});
