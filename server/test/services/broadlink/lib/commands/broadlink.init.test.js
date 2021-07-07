const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const BroadlinkHandler = require('../../../../../services/broadlink/lib');

describe('broadlink.init', () => {
  const gladys = {};
  const broadlink = {
    on: fake.returns(null),
    discover: fake.returns(null),
  };
  const serviceId = 'service-id';

  const broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

  afterEach(() => {
    sinon.reset();
  });

  it('should init service', () => {
    broadlinkHandler.init();

    expect(broadlinkHandler.handlers).and.to.have.lengthOf(2);
    expect(broadlinkHandler.broadlinkDevices).to.deep.eq({});

    assert.calledOnce(broadlink.on);
    assert.calledOnce(broadlink.discover);
  });
});
