const sinon = require('sinon');
const { expect } = require('chai');

const BroadlinkHandler = require('../../../../../services/broadlink/lib');

describe('broadlink.stop', () => {
  const gladys = {};
  const broadlink = {};
  const serviceId = 'service-id';

  const broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

  beforeEach(() => {
    broadlinkHandler.peripherals = {
      0: {},
      1: {},
    };
    broadlinkHandler.broadlinkDevices = {
      0: {},
      1: {},
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should clean all', () => {
    broadlinkHandler.stop();

    expect(broadlinkHandler.peripherals).to.deep.eq({});
    expect(broadlinkHandler.broadlinkDevices).to.deep.eq({});
  });
});
