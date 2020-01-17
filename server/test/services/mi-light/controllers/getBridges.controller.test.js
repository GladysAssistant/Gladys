const { assert, fake } = require('sinon');
const MiLightControllers = require('../../../../services/mi-light/api/milight.controller');

const bridges = [
  {
    name: 'Mi Light Bridge',
    ip: '192.168.10.245',
    mac: '00:1b:44:11:3a:b7',
    type: 'v6',
  },
];

const miLightLightService = {
  getBridges: fake.resolves(bridges),
};

const res = {
  json: fake.returns(null),
};

describe('GET /service/mi-light/bridge', () => {
  it('should get bridges', async () => {
    const miLightController = MiLightControllers(miLightLightService);
    await miLightController['get /api/v1/service/mi-light/bridge'].controller({}, res);
    assert.calledOnce(miLightLightService.getBridges);
  });
});
