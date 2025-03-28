const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const MatterHandlerMock = sinon.stub();
MatterHandlerMock.prototype.init = fake.returns(null);
MatterHandlerMock.prototype.devices = [];

const MatterService = proxyquire('../../../services/matter/index', { './lib': MatterHandlerMock });

const gladys = {};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('MatterService', () => {
  const matterService = MatterService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    await matterService.start();
    assert.calledOnce(matterService.device.init);
  });

  it('should stop service', async () => {
    matterService.stop();
    assert.notCalled(matterService.device.init);
  });

  it('isUsed: should return false, service not used', async () => {
    const used = await matterService.isUsed();
    expect(used).to.equal(false);
  });
});
