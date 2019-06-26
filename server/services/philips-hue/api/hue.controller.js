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
   * @apiParam {String} name Name of the bridge
   * @apiParam {String} ipaddress IP Address of the bridge
   * @apiGroup PhilipsHue
   */
  async function configureBridge(req, res) {
    await philipsHueLightHandler.configureBridge(req.body.name, req.body.ipaddress);
    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/philips-hue/bridge': {
      authenticated: true,
      controller: getBridges,
    },
    'post /api/v1/service/philips-hue/bridge/configure': {
      authenticated: true,
      controller: configureBridge,
    },
  };
};
