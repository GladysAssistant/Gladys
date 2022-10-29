const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const BroadlinkHandler = require('../../../../../services/broadlink/lib');

describe('broadlink.init', () => {
  const gladys = {};
  const broadlink = {
    discover: fake.returns(null),
  };
  const serviceId = 'service-id';

  const broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

  afterEach(() => {
    sinon.reset();
  });

  it('should init service', () => {
    broadlinkHandler.init();

    expect(broadlinkHandler.broadlinkDevices).to.deep.eq({});

    assert.calledOnceWithExactly(broadlink.discover);
  });
});
