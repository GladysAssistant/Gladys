const { assert, fake } = require('sinon');
const PhilipsHueControllers = require('../../../../services/philips-hue/api/hue.controller');

const lights = [
  {
    name: 'Light 1',
  },
];

const philipsHueLightService = {
  getLights: fake.resolves(lights),
};

const res = {
  json: fake.returns(null),
};

describe('GET /service/philips-hue/light', () => {
  it('should get lights', async () => {
    const philipsHueController = PhilipsHueControllers(philipsHueLightService);
    await philipsHueController['get /api/v1/service/philips-hue/light'].controller({}, res);
    assert.called(philipsHueLightService.getLights);
  });
});
