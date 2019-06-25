const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const PhilipsHueClient = require('../mocks.test');

const PhilipsHueService = proxyquire('../../../../services/philips-hue/index', {
  'node-hue-api': PhilipsHueClient,
});

describe('PhilipsHueService', () => {
  const philipsHueService = PhilipsHueService();
  it('getBridges should return bridges', async () => {
    const bridges = await philipsHueService.light.getBridges();
    expect(bridges).to.deep.equal([
      {
        name: 'Philips hue',
        ipaddress: '192.168.2.245',
      },
    ]);
  });
});
