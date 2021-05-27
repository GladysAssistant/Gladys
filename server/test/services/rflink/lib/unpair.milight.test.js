const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { assert, fake, stub } = sinon;

describe('RFLinkHandler.unpair', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should unpair a milight device', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };

    const currentMilightGateway = 'F746';
    const milightZone = '2';
    const rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    rflinkHandler.sendUsb = {
      write: stub()
        .withArgs('msg')
        .resolves(true),
    };
    await rflinkHandler.unpair(currentMilightGateway, milightZone);
    assert.called(rflinkHandler.sendUsb.write);
    const expectedMsg = `10;MiLightv1;${currentMilightGateway};0${milightZone};34BC;UNPAIR;`;
    expect(rflinkHandler.sendUsb.write.args[0][0]).to.equal(expectedMsg);
  });
});
