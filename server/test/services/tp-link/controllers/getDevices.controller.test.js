const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;
const TpLinkControllers = require('../../../../services/tp-link/api/tp-link.controller');

const devices = [
  {
    name: 'TP-Link',
    ipaddress: '192.168.2.245',
  },
];

const tpLinkService = {
  getDevices: fake.resolves(devices),
};

const res = {
  json: fake.returns(null),
};

describe('GET /api/v1/service/tp-link/scan', () => {
  it('should get devices', async () => {
    const tpLinkController = TpLinkControllers(tpLinkService);
    await tpLinkController['get /api/v1/service/tp-link/scan'].controller({}, res);
    assert.calledOnce(tpLinkService.getDevices);
  });
});
