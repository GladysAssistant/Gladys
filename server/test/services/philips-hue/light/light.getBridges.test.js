const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const PhilipsHueClient = require('../mocks.test');

const PhilipsHueService = proxyquire('../../../../services/philips-hue/index', {
  'node-hue-api': PhilipsHueClient,
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
});
