const sinon = require('sinon');

const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');
const DEVICES = require('./devicesToTest.test');
const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { assert, fake, stub } = sinon;

describe('RFLinkHandler.setValue', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should send a message to change a device s value', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    const rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');
    rflinkHandler.sendUsb = { write: stub().withArgs('msg').resolves(), };

    const device = DEVICES[0];
    const deviceFeature = DEVICE_FEATURE_CATEGORIES.SWITCH;
    const state = 'ON';

    await rflinkHandler.setValue(device, deviceFeature, state);

    assert.calledOnce(rflinkHandler.sendUsb.write);

  });
});
