const { expect } = require('chai');
const { fake } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const EwelinkApi = require('./mocks/ewelink-api.mock.test');

const EweLinkService = proxyquire('../../../services/ewelink/index', {
  'ewelink-api': EwelinkApi,
});

const variable = {
  getValue: (valueId, serviceId) => {
    if (valueId === 'EWELINK_EMAIL') {
      return Promise.resolve('email@valid.ok');
    }
    if (valueId === 'EWELINK_PASSWORD') {
      return Promise.resolve('password');
    }
    return Promise.resolve(undefined);
  },
};
const event = { emit: fake.returns(null) };
const gladys = {
  event,
  variable,
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
