const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function magicDevicesController(magicDevicesManager) {
  /**
   * @api {get} /api/v1/service/magicdevices/devices Get Magic Devices devices
   * @apiName getDevices
   * @apiGroup MagicDevices
   */
  async function getDevices(req, res) {
    const devices = await magicDevicesManager.getDevices();
    res.json(devices);
  }

  return {
    'get /api/v1/service/magicdevices/devices': {
      authenticated: true,
      controller: asyncMiddleware(getDevices),
    },
  };
};
