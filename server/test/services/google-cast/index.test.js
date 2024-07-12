const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const GoogleCastHandlerMock = sinon.stub();
GoogleCastHandlerMock.prototype.init = fake.returns(null);
GoogleCastHandlerMock.prototype.devices = [];

const GoogleCastService = proxyquire('../../../services/google-cast/index', { './lib': GoogleCastHandlerMock });

const gladys = {};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('GoogleCastService', () => {
  const googleCastService = GoogleCastService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    await googleCastService.start();
    assert.calledOnce(googleCastService.device.init);
  });

  it('should stop service', async () => {
    googleCastService.stop();
    assert.notCalled(googleCastService.device.init);
  });

  it('isUsed: should return false, service not used', async () => {
    const used = await googleCastService.isUsed();
    expect(used).to.equal(false);
  });
});
