const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function TPLinkController(tpLinkSmartDeviceHandler) {
  /**
   * @api {get} /api/v1/service/tp-link/scan Get devices
   * @apiName GetDevices
   * @apiGroup TPLink
   */
  async function getDevices(req, res) {
    const devices = await tpLinkSmartDeviceHandler.getDevices();
    res.json(devices);
  }

  /**
   * @api {post} /api/v1/service/tp-link/plugs/:device_id/on Turn on
   * @apiName TurnOn
   * @apiGroup TPLink
   */
  async function turnOn(req, res) {
    await tpLinkSmartDeviceHandler.setValue(req.params.device_id, 1);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/tp-link/devices/:device_id/off Turn off
   * @apiName TurnOff
   * @apiGroup TPLink
   */
  async function turnOff(req, res) {
    await tpLinkSmartDeviceHandler.setValue(req.params.device_id, 0);
    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/tp-link/scan': {
      authenticated: true,
      controller: asyncMiddleware(getDevices),
    },
    'post /api/v1/service/tp-link/devices/:device_id/on': {
      authenticated: true,
      controller: asyncMiddleware(turnOn),
    },
    'post /api/v1/service/tp-link/devices/:device_id/off': {
      authenticated: true,
      controller: asyncMiddleware(turnOff),
    },
  };
};
