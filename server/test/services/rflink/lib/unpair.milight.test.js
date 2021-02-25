const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { fake } = sinon;

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

    const currentMilightGateway = '1';
    const milightZone = '2';
    const rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    rflinkHandler.sendUsb = SerialPortMock;
    await rflinkHandler.connect('/dev/tty1');
    await rflinkHandler.unpair(currentMilightGateway, milightZone);
    // @Todo assert.calledOnce(rflinkHandler.sendUsb.write);
    // @Todo assert.calledOnce(rflinkHandler.addDevices);
    // @Todo assert.calledOnce(rflinkHandler.sendUsb.write);
  });

});
