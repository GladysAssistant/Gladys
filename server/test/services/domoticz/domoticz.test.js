const { expect } = require('chai');
const proxyquire = require('proxyquire');
const { Gladys, MockedClient } = require('./mocks.test');

const DomoticzService = proxyquire('../../../services/domoticz/index', {
  axios: MockedClient,
});

describe('DomoticzService', () => {
  const gladys = new Gladys();
  const domoticzService = DomoticzService(gladys, 'be86c4db-489f-466c-aeea-1e262c4ee720');
  it('should start service', async () => {
    await domoticzService.start();
  });
  it('should stop service', async () => {
    await domoticzService.stop();
  });
  it('should have controllers', () => {
    expect(domoticzService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
});
