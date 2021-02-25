const { expect } = require('chai');
const { fake, assert } = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { MockedPhilipsHueClient } = require('../mocks.test');

const PhilipsHueService = proxyquire('../../../../services/philips-hue/index', {
  'node-hue-api': MockedPhilipsHueClient,
});

describe('PhilipsHueService', () => {
  it('getBridges should return bridges', async () => {
    const philipsHueService = PhilipsHueService();
    const bridges = await philipsHueService.device.getBridges();
    expect(bridges).to.deep.equal([
      {
        name: 'Philips Hue Bridge',
        ipaddress: '192.168.2.245',
        model: {
          serial: '1234',
        },
      },
    ]);
  });
  it('getBridges should return bridges with upnp search', async () => {
    const philipsHueService = PhilipsHueService();
    philipsHueService.device.hueClient.discovery.nupnpSearch = fake.resolves([]);
    philipsHueService.device.hueClient.discovery.upnpSearch = fake.resolves([
      {
        name: 'Philips Hue Bridge',
        ipaddress: '192.168.2.245',
        model: {
          serial: 'FOUND_BY_UPNP_SEARCH',
        },
      },
    ]);
    const bridges = await philipsHueService.device.getBridges();
    expect(bridges).to.deep.equal([
      {
        name: 'Philips Hue Bridge',
        ipaddress: '192.168.2.245',
        model: {
          serial: 'FOUND_BY_UPNP_SEARCH',
        },
      },
    ]);
    assert.calledOnce(philipsHueService.device.hueClient.discovery.nupnpSearch);
    assert.calledOnce(philipsHueService.device.hueClient.discovery.upnpSearch);
  });
});
