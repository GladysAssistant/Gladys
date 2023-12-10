const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function HueController(philipsHueLightHandler) {
  /**
   * @api {get} /api/v1/service/philips-hue/bridge Get Philips Hue bridges
   * @apiName GetBridges
   * @apiGroup PhilipsHue
   */
  async function getBridges(req, res) {
    const bridges = await philipsHueLightHandler.getBridges();
    res.json(bridges);
  }

  /**
   * @api {post} /api/v1/service/philips-hue/bridge/configure Configure Philips Hue Bridge
   * @apiName ConfigureBridge
   * @apiParam {String} ipAddress IP Address of the bridge
   * @apiGroup PhilipsHue
   */
  async function configureBridge(req, res) {
    const bridge = await philipsHueLightHandler.configureBridge(req.body.ipAddress);
    res.json(bridge);
  }

  /**
   * @api {get} /api/v1/service/philips-hue/light Get lights
   * @apiName GetLights
   * @apiGroup PhilipsHue
   */
  async function getLights(req, res) {
    const lights = await philipsHueLightHandler.getLights();
    res.json(lights);
  }

  /**
   * @api {get} /api/v1/service/philips-hue/scene Get scenes
   * @apiName GetScenes
   * @apiGroup PhilipsHue
   */
  async function getScenes(req, res) {
    const scenes = await philipsHueLightHandler.getScenes();
    res.json(scenes);
  }

  /**
   * @api {post} /api/v1/service/philips-hue/scene/:philipe_hue_scene_id/activate Active scene
   * @apiName GetScenes
   * @apiGroup PhilipsHue
   */
  async function activateScene(req, res) {
    await philipsHueLightHandler.activateScene(req.body.bridge_serial_number, req.params.philipe_hue_scene_id);
    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/philips-hue/bridge': {
      authenticated: true,
      controller: asyncMiddleware(getBridges),
    },
    'post /api/v1/service/philips-hue/bridge/configure': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(configureBridge),
    },
    'get /api/v1/service/philips-hue/light': {
      authenticated: true,
      controller: asyncMiddleware(getLights),
    },
    'get /api/v1/service/philips-hue/scene': {
      authenticated: true,
      controller: asyncMiddleware(getScenes),
    },
    'post /api/v1/service/philips-hue/scene/:philipe_hue_scene_id/activate': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(activateScene),
    },
  };
};
