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

  /**
   * @api {get} /api/v1/service/philips-hue/bridge/lights Get lights from Philips Hue bridge
   * @apiName getLightsFromBridge
   * @apiGroup PhilipsHue
   */
  async function getLightsFromBridge(req, res) {
    await philipsHueLightHandler.getLightsFromBridge();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/philips-hue/bridge/lights Turn On a Philips Hue light
   * @apiName turnOn
   * @apiGroup PhilipsHue
   */
  async function turnOn(req, res) {
    const { deviceId } = req.params.deviceId;
    // TODO: Fetch device from deviceId
    await philipsHueLightHandler.turnOn(deviceId);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/philips-hue/bridge/lights Turn Off a Philips Hue light
   * @apiName turnOff
   * @apiGroup PhilipsHue
   */
  async function turnOff(req, res) {
    const { deviceId } = req.params.deviceId;
    // TODO: Fetch device from deviceId
    await philipsHueLightHandler.turnOff(deviceId);
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
    'get /api/v1/service/philips-hue/bridge/lights': {
      authenticated: true,
      controller: getLightsFromBridge,
    },
    'post /api/v1/service/philips-hue/bridge/lights/:deviceId/on': {
      authenticated: true,
      controller: turnOn,
    },
    'post /api/v1/service/philips-hue/bridge/lights/:deviceId/off': {
      authenticated: true,
      controller: turnOff,
    },
  };
};
