const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const SonosHandlerMock = sinon.stub();
SonosHandlerMock.prototype.init = fake.returns(null);
SonosHandlerMock.prototype.devices = [];

const SonosService = proxyquire('../../../services/sonos/index', { './lib': SonosHandlerMock });

const gladys = {};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('SonosService', () => {
  const sonosService = SonosService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    await sonosService.start();
    assert.calledOnce(sonosService.device.init);
  });

  it('should stop service', async () => {
    sonosService.stop();
    assert.notCalled(sonosService.device.init);
  });

  it('isUsed: should return false, service not used', async () => {
    const used = await sonosService.isUsed();
    expect(used).to.equal(false);
  });
});
