const sinon = require('sinon');

const proxyquire = require('proxyquire');

const { fake, assert } = sinon;

const Poll = proxyquire('../../../../services/sunspec/lib/sunspec.poll', {}).poll;

describe('SunSpec poll', () => {
  // PREPARE
  let sunSpecManager;

  beforeEach(() => {
    sunSpecManager = {
      scanDevices: fake.returns(null),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should poll', async () => {
    await Poll.call(sunSpecManager);
    assert.callCount(sunSpecManager.scanDevices, 1);
  });
});
