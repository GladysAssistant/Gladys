const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { event, variableOk } = require('./mocks/consts.test');
const EwelinkApi = require('./mocks/ewelink-api.mock.test');

const EweLinkService = proxyquire('../../../services/ewelink/index', {
  'ewelink-api': EwelinkApi,
});

const gladys = {
  event,
  variable: variableOk,
};

describe('EweLinkService', () => {
  const eweLinkService = EweLinkService(gladys, 'a810b8db-6d04-4697-bed3-c4b72c996279');

  it('should have controllers', () => {
    expect(eweLinkService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  it('should start service', async () => {
    await eweLinkService.start();
  });
  it('should stop service', async () => {
    await eweLinkService.stop();
  });
});
