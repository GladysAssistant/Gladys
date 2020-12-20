const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { MockedPhilipsHueClient } = require('./mocks.test');

const PhilipsHueService = proxyquire('../../../services/philips-hue/index', {
  'node-hue-api': MockedPhilipsHueClient,
});

describe('PhilipsHueService', () => {
  it('should have controllers', () => {
    const philipsHueService = PhilipsHueService();
    expect(philipsHueService)
      .to.have.property('controllers')
      .and.be.instanceOf(Object);
  });
  it('should start service', async () => {
    const philipsHueService = PhilipsHueService();
    await philipsHueService.start();
  });
  it('should stop service', async () => {
    const philipsHueService = PhilipsHueService();
    await philipsHueService.stop();
  });
});
