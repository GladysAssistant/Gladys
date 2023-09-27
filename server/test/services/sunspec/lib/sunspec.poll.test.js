const sinon = require('sinon');

const proxyquire = require('proxyquire');

const { fake, assert } = sinon;

const Poll = proxyquire('../../../../services/sunspec/lib/sunspec.poll', {}).poll;

describe('SunSpec poll', () => {
  // PREPARE
  let sunspecManager;

  beforeEach(() => {
    sunspecManager = {
      scanDevices: fake.returns(null),
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should poll', async () => {
    await Poll.call(sunspecManager);
    assert.callCount(sunspecManager.scanDevices, 1);
  });
});
