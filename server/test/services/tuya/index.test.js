const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { STATUS } = require('../../../services/tuya/lib/utils/tuya.constants');

const { assert, fake } = sinon;

const TuyaHandlerMock = sinon.stub();
TuyaHandlerMock.prototype.init = fake.returns(null);
TuyaHandlerMock.prototype.loadDevices = fake.returns(null);
TuyaHandlerMock.prototype.disconnect = fake.returns(null);

const TuyaService = proxyquire('../../../services/tuya/index', { './lib': TuyaHandlerMock });

const gladys = {};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaService', () => {
  const tuyaService = TuyaService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    await tuyaService.start();
    assert.calledOnce(tuyaService.device.init);
    assert.calledOnce(tuyaService.device.loadDevices);
    assert.notCalled(tuyaService.device.disconnect);
  });

  it('should stop service', async () => {
    tuyaService.stop();
    assert.notCalled(tuyaService.device.init);
    assert.calledOnce(tuyaService.device.disconnect);
  });

  it('isUsed: should return false, service not used', async () => {
    const used = await tuyaService.isUsed();
    expect(used).to.equal(false);
  });

  it('isUsed: should return true, service is used', async () => {
    tuyaService.device.status = STATUS.CONNECTED;
    tuyaService.device.connector = {};
    const used = await tuyaService.isUsed();
    expect(used).to.equal(true);
  });
});
