const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const { assert, fake } = sinon;

const AirplayHandlerMock = sinon.stub();
AirplayHandlerMock.prototype.init = fake.returns(null);
AirplayHandlerMock.prototype.devices = [];

const AirplayService = proxyquire('../../../services/airplay/index', { './lib': AirplayHandlerMock });

const gladys = {};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('AirplayService', () => {
  const airplayService = AirplayService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    await airplayService.start();
    assert.calledOnce(airplayService.device.init);
  });

  it('should stop service', async () => {
    airplayService.stop();
    assert.notCalled(airplayService.device.init);
  });

  it('isUsed: should return false, service not used', async () => {
    const used = await airplayService.isUsed();
    expect(used).to.equal(false);
  });
});
