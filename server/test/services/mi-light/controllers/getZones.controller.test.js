const { assert, fake } = require('sinon');
const MiLightControllers = require('../../../../services/mi-light/api/milight.controller');

const zones = [
  {
    name: 'Zone 1',
  },
];

const miLightLightService = {
  getZones: fake.resolves(zones),
};

const res = {
  json: fake.returns(null),
};

describe('GET /service/mi-light/light', () => {
  it('should get zones', async () => {
    const miLightController = MiLightControllers(miLightLightService);
    await miLightController['get /api/v1/service/mi-light/light'].controller({}, res);
    assert.called(miLightLightService.getZones);
  });
});
