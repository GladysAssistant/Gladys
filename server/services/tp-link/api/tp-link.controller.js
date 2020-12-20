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

  return {
    'get /api/v1/service/tp-link/scan': {
      authenticated: true,
      controller: asyncMiddleware(getDevices),
    },
  };
};
