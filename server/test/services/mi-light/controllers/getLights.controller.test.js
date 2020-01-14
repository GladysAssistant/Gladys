const { assert, fake } = require('sinon');
const MiLightControllers = require('../../../../services/mi-light/api/milight.controller');

const lights = [
  {
    name: 'Zone 1',
  },
];

const miLightLightService = {
  getLights: fake.resolves(lights),
};

const res = {
  json: fake.returns(null),
};

describe('GET /service/mi-light/light', () => {
  it('should get lights', async () => {
    const miLightController = MiLightControllers(miLightLightService);
    await miLightController['get /api/v1/service/mi-light/light'].controller({}, res);
    assert.called(miLightLightService.getLights);
  });
});
