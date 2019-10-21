const { assert, fake } = require('sinon');
const PhilipsHueControllers = require('../../../../services/philips-hue/api/hue.controller');

const scenes = [
  {
    id: '087f88f52-on-0',
    name: 'Sunset on 1458750088221',
    bridge_serial_number: '00178826f352',
  },
];

const philipsHueLightService = {
  getScenes: fake.resolves(scenes),
};

const res = {
  json: fake.returns(null),
};

describe('GET /service/philips-hue/scene', () => {
  it('should get scenes', async () => {
    const philipsHueController = PhilipsHueControllers(philipsHueLightService);
    await philipsHueController['get /api/v1/service/philips-hue/scene'].controller({}, res);
    assert.called(philipsHueLightService.getScenes);
  });
});
