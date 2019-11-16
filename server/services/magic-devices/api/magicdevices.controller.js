const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function magicDevicesController(magicDevicesManager) {
  /**
   * @api {get} /api/v1/service/magic-devices/devices Get Magic Devices
   * @apiName getDevices
   * @apiGroup MagicDevices
   */
  async function getDevices(req, res) {
    const devices = await magicDevicesManager.getDevices();
    res.json(devices);
  }

  return {
    'get /api/v1/service/magic-devices/devices': {
      authenticated: true,
      controller: asyncMiddleware(getDevices),
    },
  };
};
