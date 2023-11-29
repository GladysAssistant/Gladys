const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { STATUS } = require('../../../services/netatmo/lib/utils/netatmo.constants');

const { assert, fake } = sinon;

const NetatmoHandlerMock = sinon.stub();
NetatmoHandlerMock.prototype.init = fake.returns(null);
NetatmoHandlerMock.prototype.disconnect = fake.returns(null);

const NetatmoService = proxyquire('../../../services/netatmo/index', { './lib': NetatmoHandlerMock });

const gladys = {};
const serviceId = 'ecca4d93-7a8c-4761-9055-fc15460a4b4a';


describe.only('NetatmoService', () => {
  const netatmoService = NetatmoService(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should start service', async () => {
    await netatmoService.start();
    assert.calledOnce(netatmoService.device.init);
    assert.notCalled(netatmoService.device.disconnect);
  });

  it('should stop service', async () => {
    netatmoService.stop();
    assert.notCalled(netatmoService.device.init);
    assert.calledOnce(netatmoService.device.disconnect);
  });

  it('isUsed: should return false, service not used', async () => {
    const used = await netatmoService.isUsed();
    expect(used).to.equal(false);
  });

  it('isUsed: should return true, service is used', async () => {
    netatmoService.device.status = STATUS.CONNECTED;
    const used = await netatmoService.isUsed();
    expect(used).to.equal(true);
  });
});
