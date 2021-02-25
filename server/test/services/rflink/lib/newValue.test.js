const sinon = require('sinon');


const proxyquire = require('proxyquire').noCallThru();
const SerialPortMock = require('../SerialPortMock.test');
const DEVICES = require('./devicesToTest.test');

const RFLinkHandler = proxyquire('../../../../services/rflink/lib', {
  serialport: SerialPortMock,
});

const { assert, fake } = sinon;
const { EVENTS } = require('../../../../utils/constants');

describe('RFLinkHandler.newValue', () => {
  beforeEach(() => {
    sinon.reset();
  });

  it('should update a device with a new value', async () => {
    const gladys = {
      event: {
        emit: fake.returns(null),
      },
    };
    const rflinkHandler = new RFLinkHandler(gladys, 'faea9c35-759a-44d5-bcc9-2af1de37b8b4');

    const device = DEVICES[0];
    const deviceFeature = 'temperature';
    const state = 'ON';

    await rflinkHandler.newValue(device, deviceFeature, state);

    assert.calledWith(gladys.event.emit, EVENTS.DEVICE.NEW_STATE,
      { device_feature_external_id: `rflink:${device.id}:${deviceFeature}:${device.switch}`, state: 0.1, });
  });



});
