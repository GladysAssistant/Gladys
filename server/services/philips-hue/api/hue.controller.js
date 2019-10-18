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
   * @apiParam {String} serial Serial number of the bridge
   * @apiGroup PhilipsHue
   */
  async function configureBridge(req, res) {
    const bridge = await philipsHueLightHandler.configureBridge(req.body.serial);
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

  return {
    'get /api/v1/service/philips-hue/bridge': {
      authenticated: true,
      controller: asyncMiddleware(getBridges),
    },
    'post /api/v1/service/philips-hue/bridge/configure': {
      authenticated: true,
      controller: asyncMiddleware(configureBridge),
    },
    'get /api/v1/service/philips-hue/light': {
      authenticated: true,
      controller: asyncMiddleware(getLights),
    },
  };
};
