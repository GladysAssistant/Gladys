const sinon = require('sinon');
const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { expect } = chai;

describe('RFLinkHandler.addDevice', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should add new devices', async () => {
    const gladys = {};
    const rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    const deviceList = ['1', '2'];
    rflinkHandler.addDevice(deviceList);
    expect(rflinkHandler.devices)
      .to.be.an('array')
      .that.deep.equal(deviceList);
    rflinkHandler.addDevice(undefined);
    expect(rflinkHandler.devices)
      .to.be.an('array')
      .that.deep.equal(deviceList);
  });
});
