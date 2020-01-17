const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();
const milightClient = require('../mocks.test');

const MiLightService = proxyquire('../../../../services/mi-light/index', {
  'node-milight-promise': milightClient,
});

describe('MiLightService', () => {
  it('getBridges should return bridges', async () => {
    const miLightService = MiLightService();
    const bridges = await miLightService.device.getBridges();
    expect(bridges).to.deep.equal([
      {
        name: 'Mi Light Bridge',
        ip: '192.168.10.245',
        mac: '00:1b:44:11:3a:b7', 
        type: 'v6',
      },
    ]);
  });
});
