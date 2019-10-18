const { assert, fake } = require('sinon');
const PhilipsHueControllers = require('../../../../services/philips-hue/api/hue.controller');

const bridges = [
  {
    name: 'Philips hue',
    ipaddress: '192.168.2.245',
  },
];

const philipsHueLightService = {
  getBridges: fake.resolves(bridges),
};

const res = {
  json: fake.returns(null),
};

describe('GET /service/philips-hue/bridge', () => {
  it('should get bridges', async () => {
    const philipsHueController = PhilipsHueControllers(philipsHueLightService);
    await philipsHueController['get /api/v1/service/philips-hue/bridge'].controller({}, res);
    assert.calledOnce(philipsHueLightService.getBridges);
  });
});
