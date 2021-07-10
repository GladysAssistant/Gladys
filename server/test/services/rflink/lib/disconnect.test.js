const sinon = require('sinon');
const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { fake } = sinon;
const { expect } = chai;

describe('RFLinkHandler.disconnect', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should disconnect and set right state of handler', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    const rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    await rflinkHandler.disconnect();
    expect(rflinkHandler.connected).to.equal(false);
    expect(rflinkHandler.ready).to.equal(false);
    expect(rflinkHandler.scanInProgress).to.equal(false);
  });
});
