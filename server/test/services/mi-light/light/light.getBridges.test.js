const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const MiLightClient = require('../mocks.test');

const MiLightService = proxyquire('../../../../services/mi-light/index', {
  'node-hue-api': MiLightClient,
});

describe('MiLightService', () => {
  it('getBridges should return bridges', async () => {
    const miLightService = MiLightService();
    const bridges = await miLightService.device.getBridges();
    expect(bridges).to.deep.equal([
      {
        name: 'Mi Light Bridge',
        ipaddress: '192.168.10.245',
        model: {
          mac: '00:1B:44:11:3A:B7',
        },
      },
    ]);
  });
});
