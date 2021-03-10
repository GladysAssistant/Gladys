const { expect } = require('chai');

const proxyquire = require('proxyquire').noCallThru();

const NetatmoMock = require('./netatmo.mock.test');

const gladys = {
  config: {
    tempFolder: '/tmp/gladys',
  },
};

const NetatmoService = proxyquire('../../../services/netatmo/index', {
  './lib': NetatmoMock,
});

describe('NetatmoService', () => {
  const netatmoService = NetatmoService();
  it('should have controllers', () => {
    expect(netatmoService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  it('should have devices', () => {
    expect(netatmoService)
      .to.have.property('device')
      .and.be.instanceOf(Object);
  });
  it('should have start function', () => {
    expect(netatmoService)
      .to.have.property('start')
      .and.be.instanceOf(Function);
  });
  it('should have stop function', () => {
    expect(netatmoService)
      .to.have.property('stop')
      .and.be.instanceOf(Function);
  });
});

describe('NetatmoService lifycycle', () => {
  const netatmoService = NetatmoService(gladys);
  it('should start service', async () => {
    await netatmoService.start();
  });
  it('should stop service', async () => {
    await netatmoService.stop();
  });
});
