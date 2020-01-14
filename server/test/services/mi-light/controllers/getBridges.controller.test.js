const { assert, fake } = require('sinon');
const MiLightControllers = require('../../../../services/mi-light/api/milight.controller');

const bridges = [
  {
    name: 'Mi light',
    ipaddress: '192.168.10.245',
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
