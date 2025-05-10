const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const MatterHandlerMock = sinon.stub();
MatterHandlerMock.prototype.init = fake.returns(null);
MatterHandlerMock.prototype.stop = fake.returns(null);
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
    gladys.variable = {
      getValue: fake.returns('true'),
    };
    await matterService.start();
    assert.calledOnce(matterService.device.init);
  });

  it('should not start service, service is not active', async () => {
    gladys.variable = {
      getValue: fake.returns(null),
    };
    await matterService.start();
    assert.notCalled(matterService.device.init);
  });

  it('should not start service, service is not active', async () => {
    gladys.variable = {
      getValue: fake.returns('false'),
    };
    await matterService.start();
    assert.notCalled(matterService.device.init);
  });

  it('should stop service', async () => {
    await matterService.stop();
    assert.notCalled(matterService.device.init);
    assert.called(matterService.device.stop);
  });

  it('isUsed: should return false, service not used', async () => {
    const used = await matterService.isUsed();
    expect(used).to.equal(false);
  });
});
