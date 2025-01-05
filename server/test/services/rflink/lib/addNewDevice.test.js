const sinon = require('sinon');
const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const DEVICES = require('./devicesToTest.test');

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
    rflinkHandler.addDevice(DEVICES);
  });

  it('should add new devices', async () => {
    const device = {
      external_id: `rflink:86aa7:666`,
    };
    expect(rflinkHandler.newDevices).to.have.lengthOf(0);
    expect(rflinkHandler.devices)
      .to.be.an('array')
      .that.deep.equal(DEVICES);
    rflinkHandler.addNewDevice(device);
    assert.calledOnce(gladys.event.emit);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.RFLINK.NEW_DEVICE,
    });
    expect(rflinkHandler.newDevices).to.have.lengthOf(1);
    expect(rflinkHandler.newDevices)
      .to.be.an('array')
      .that.includes(device);
  });

  it('should not add 2 same devices in the list', async () => {
    const device = DEVICES[0];
    expect(rflinkHandler.newDevices).to.have.lengthOf(0);
    expect(rflinkHandler.devices)
      .to.be.an('array')
      .that.deep.equal(DEVICES);
    rflinkHandler.addNewDevice(device);
    assert.notCalled(gladys.event.emit);
    expect(rflinkHandler.newDevices).to.have.lengthOf(0);
  });
});
