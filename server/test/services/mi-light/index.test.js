const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const MiLightClient = require('./mocks.test');

const MiLightService = proxyquire('../../../services/mi-light/index', {
  'node-milight-promise': MiLightClient,
});

describe('miLightService', () => {
  it('should have controllers', () => {
    const miLightService = MiLightService();
    expect(miLightService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  it('should start service', async () => {
    const miLightService = MiLightService();
    await miLightService.start();
  });
  it('should stop service', async () => {
    const miLightService = MiLightService();
    await miLightService.stop();
  });
});
