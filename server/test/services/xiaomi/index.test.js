const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

const XiaomiService = proxyquire('../../../services/xiaomi/index', {});

describe('XiaomiService', () => {
  const xiaomiService = XiaomiService();
  it('should have start function', () => {
    expect(xiaomiService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
  });
  it('should have stop function', () => {
    expect(xiaomiService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });
  it('should have controllers', () => {
    expect(xiaomiService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
});

describe('XiaomiService lifecycle', () => {
  const xiaomiService = XiaomiService();
  it('should start the service', async () => {
    await xiaomiService.start();
  });
  it('should stop the service', async () => {
    await xiaomiService.stop();
  });
});