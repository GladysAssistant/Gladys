const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const PhilipsHueClient = require('./mocks.test');

const PhilipsHueService = proxyquire('../../../services/philips-hue/index', {
  'node-hue-api': PhilipsHueClient,
});

describe('PhilipsHueService', () => {
  const philipsHueService = PhilipsHueService();
  it('should have controllers', () => {
    expect(philipsHueService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  it('should start service', async () => {
    await philipsHueService.start();
  });
  it('should stop service', async () => {
    await philipsHueService.stop();
  });
});
