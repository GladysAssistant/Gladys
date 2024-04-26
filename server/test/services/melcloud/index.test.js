const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { STATUS } = require('../../../services/melcloud/lib/utils/melcloud.constants');

const { assert, fake } = sinon;

const MELCloudHandlerMock = sinon.stub();
MELCloudHandlerMock.prototype.init = fake.returns(null);
MELCloudHandlerMock.prototype.loadDevices = fake.returns(null);
MELCloudHandlerMock.prototype.disconnect = fake.returns(null);

const MELCloudService = proxyquire('../../../services/melcloud/index', { './lib': MELCloudHandlerMock });

const gladys = {};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('MELCloudService', () => {
  const melcloudService = MELCloudService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    await melcloudService.start();
    assert.calledOnce(melcloudService.device.init);
    assert.calledOnce(melcloudService.device.loadDevices);
    assert.notCalled(melcloudService.device.disconnect);
  });

  it('should stop service', async () => {
    melcloudService.stop();
    assert.notCalled(melcloudService.device.init);
    assert.calledOnce(melcloudService.device.disconnect);
  });

  it('isUsed: should return false, service not used', async () => {
    const used = await melcloudService.isUsed();
    expect(used).to.equal(false);
  });

  it('isUsed: should return true, service is used', async () => {
    melcloudService.device.status = STATUS.CONNECTED;
    melcloudService.device.connector = {};
    const used = await melcloudService.isUsed();
    expect(used).to.equal(true);
  });
});
