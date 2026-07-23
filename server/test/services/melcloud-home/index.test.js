const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const { STATUS } = require('../../../services/melcloud-home/lib/utils/melcloud-home.constants');

const { assert, fake } = sinon;

const MELCloudHomeHandlerMock = sinon.stub();
MELCloudHomeHandlerMock.prototype.init = fake.returns(null);
MELCloudHomeHandlerMock.prototype.loadDevices = fake.returns(null);
MELCloudHomeHandlerMock.prototype.disconnect = fake.returns(null);

const MELCloudHomeService = proxyquire('../../../services/melcloud-home/index', { './lib': MELCloudHomeHandlerMock });

const gladys = {};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('MELCloudHomeService', () => {
  const melCloudHomeService = MELCloudHomeService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    await melCloudHomeService.start();
    assert.calledOnce(melCloudHomeService.device.init);
    assert.calledOnce(melCloudHomeService.device.loadDevices);
    assert.notCalled(melCloudHomeService.device.disconnect);
  });

  it('should stop service', async () => {
    await melCloudHomeService.stop();
    assert.calledOnce(melCloudHomeService.device.disconnect);
  });

  it('isUsed: should return false when not used', async () => {
    melCloudHomeService.device.status = STATUS.NOT_INITIALIZED;
    melCloudHomeService.device.accessToken = null;
    const used = await melCloudHomeService.isUsed();
    expect(used).to.equal(false);
  });

  it('isUsed: should return true when used', async () => {
    melCloudHomeService.device.status = STATUS.CONNECTED;
    melCloudHomeService.device.accessToken = 'token';
    const used = await melCloudHomeService.isUsed();
    expect(used).to.equal(true);
  });
});
