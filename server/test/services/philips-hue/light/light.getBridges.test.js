const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const { MockedPhilipsHueClient, MockedPhilipsHueClientUpnp } = require('../mocks.test');

const PhilipsHueService = proxyquire('../../../../services/philips-hue/index', {
  'node-hue-api': MockedPhilipsHueClient,
});

const PhilipsHueServiceUpnp = proxyquire('../../../../services/philips-hue/index', {
  'node-hue-api': MockedPhilipsHueClientUpnp,
});

describe('PhilipsHueService', () => {
  it('getBridges should return bridges with nupnp Search', async () => {
    const philipsHueService = PhilipsHueService();
    const bridges = await philipsHueService.device.getBridges();
    expect(bridges).to.deep.equal([
      {
        name: 'Philips Hue Bridge',
        ipaddress: '192.168.1.10',
      },
    ]);
  });
  it('getBridges should return bridges with upnp Search', async () => {
    const philipsHueService = PhilipsHueServiceUpnp();
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
});
