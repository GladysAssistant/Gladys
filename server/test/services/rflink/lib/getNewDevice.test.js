const sinon = require('sinon');
const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { fake } = sinon;
const { expect } = chai;

describe('RFLinkHandler.getNewDevice', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should get new devices', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    const rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    rflinkHandler.newDevices = ['1'];
    const devices = rflinkHandler.getNewDevices();
    expect(devices)
      .to.be.an('array')
      .that.deep.equal(['1']);
  });
});
