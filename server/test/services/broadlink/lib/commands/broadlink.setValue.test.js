const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;
const BroadlinkHandler = require('../../../../../services/broadlink/lib');
const { BadParameters, ServiceNotConfiguredError } = require('../../../../../utils/coreErrors');

describe('broadlink.setValue', () => {
  const gladys = {};
  const broadlink = {};
  const serviceId = 'service-id';

  const peripheralId = 'peripheralId';
  const device = {};
  const feature = {};
  const value = 0;

  const broadlinkHandler = new BroadlinkHandler(gladys, broadlink, serviceId);

  const notMatcherHander = {
    getPeripheralId: fake.returns(null),
  };
  const matcherHandler = {
    getPeripheralId: fake.returns(peripheralId),
    setValue: fake.returns(null),
  };
  const avoidedMatcher = {
    getPeripheralId: fake.returns(null),
  };

  afterEach(() => {
    sinon.reset();
  });

  it('no handler matches', () => {
    broadlinkHandler.handlers = [notMatcherHander];

    try {
      broadlinkHandler.setValue(device, feature, value);
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
    }

    assert.calledWith(notMatcherHander.getPeripheralId, device);
  });

  it('handler matches, but no peripheral', () => {
    broadlinkHandler.handlers = [notMatcherHander, matcherHandler, avoidedMatcher];

    try {
      broadlinkHandler.setValue(device, feature, value);
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }

    assert.calledWith(notMatcherHander.getPeripheralId, device);
    assert.calledWith(matcherHandler.getPeripheralId, device);
    assert.notCalled(avoidedMatcher.getPeripheralId);

    assert.notCalled(matcherHandler.setValue);
  });

  it('handler matches, with peripheral', () => {
    broadlinkHandler.handlers = [notMatcherHander, matcherHandler, avoidedMatcher];
    broadlinkHandler.broadlinkDevices[peripheralId] = {};

    broadlinkHandler.setValue(device, feature, value);

    assert.calledWith(notMatcherHander.getPeripheralId, device);
    assert.calledWith(matcherHandler.getPeripheralId, device);
    assert.notCalled(avoidedMatcher.getPeripheralId);

    assert.calledWith(matcherHandler.setValue, {}, device, feature, value);
  });
});
