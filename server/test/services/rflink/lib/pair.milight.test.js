const sinon = require('sinon');
const chai = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { fake } = sinon;
const { expect } = chai;

describe('RFLinkHandler.pair', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should pair a milight device', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };

    const currentMilightGateway = '1';
    const milightZone = '2';

    const rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    expect(rflinkHandler.newDevices).to.have.lengthOf(0);
    await rflinkHandler.connect('/dev/tty1');
    await rflinkHandler.pair(currentMilightGateway, milightZone);
    expect(rflinkHandler.newDevices).to.have.lengthOf(1);
  });

  it('should pair nothing', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };

    const currentMilightGateway = undefined;
    const milightZone = '2';

    const rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    rflinkHandler.sendUsb = SerialPortMock;
    expect(rflinkHandler.newDevices).to.have.lengthOf(0);
    await rflinkHandler.connect('/dev/tty1');
    await rflinkHandler.pair(currentMilightGateway, milightZone);
    expect(rflinkHandler.newDevices).to.have.lengthOf(0);
  });
});
