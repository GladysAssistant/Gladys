const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function MilightController(miLighLightHandler) {
  /**
   * @api {get} /api/v1/service/mi-light/bridge Get Mi Light bridges
   * @apiName GetBridges
   * @apiGroup MiLight
   */
  async function getBridges(req, res) {
    const bridges = await miLighLightHandler.getBridges();
    res.json(bridges);
  }

  /**
   * @api {post} /api/v1/service/mi-light/bridge/configure Configure Mi Light Bridge
   * @apiName ConfigureBridge
   * @apiParam {String} mac Mac address of the bridge
   * @apiGroup MiLight
   */
  async function configureBridge(req, res) {
    const bridge = await miLighLightHandler.configureBridge(req.body.mac);
    res.json(bridge);
  }

  /**
   * @api {get} /api/v1/service/mi-light/light Get lights
   * @apiName getZones
   * @apiGroup MiLight
   */
  async function getZones(req, res) {
    const lights = await miLighLightHandler.getZones();
    res.json(lights);
  }

  return {
    'get /api/v1/service/mi-light/bridge': {
      authenticated: true,
      controller: asyncMiddleware(getBridges),
    },
    'post /api/v1/service/mi-light/bridge/configure': {
      authenticated: true,
      controller: asyncMiddleware(configureBridge),
    },
    'get /api/v1/service/mi-light/light': {
      authenticated: true,
      controller: asyncMiddleware(getZones),
    },
  };
};
