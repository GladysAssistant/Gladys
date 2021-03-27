const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;
const BroadlinkHandler = require('../../../../services/broadlink/lib');

const gladys = {};
const broadlink = {
  removeAllListeners: fake.returns(true),
};
const serviceId = 'service-id';

describe('BroadlinkHandler stop', () => {
  const broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

  it('stop method', () => {
    const device1 = {
      removeAllListeners: fake.returns(true),
    };

    broadlinkHandler.peripherals = {
      'device-1': {},
    };
    broadlinkHandler.broadlinkDevices = {
      'device-1': device1,
    };

    broadlinkHandler.stop();

    expect(broadlinkHandler.peripherals).to.deep.eq({});
    expect(broadlinkHandler.broadlinkDevices).to.deep.eq({});
    assert.calledOnce(broadlink.removeAllListeners);
    assert.calledOnce(device1.removeAllListeners);
  });
});
