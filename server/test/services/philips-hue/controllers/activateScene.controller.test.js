const { assert, fake } = require('sinon');
const PhilipsHueControllers = require('../../../../services/philips-hue/api/hue.controller');

const philipsHueLightService = {
  activateScene: fake.resolves(null),
};

const res = {
  json: fake.returns(null),
};

describe('POST /service/philips-hue/scene/:scene_id/activate', () => {
  it('should activate scene', async () => {
    const philipsHueController = PhilipsHueControllers(philipsHueLightService);
    await philipsHueController['post /api/v1/service/philips-hue/scene/:philipe_hue_scene_id/activate'].controller(
      {
        params: {
          philipe_hue_scene_id: 'scene-id',
        },
        body: {
          bridge_serial_number: '1234',
        },
      },
      res,
    );
    assert.calledWith(philipsHueLightService.activateScene, '1234', 'scene-id');
  });
});
