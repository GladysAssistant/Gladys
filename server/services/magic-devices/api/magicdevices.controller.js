const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const logger = require('../../../../utils/logger');

module.exports = function magicDevicesController(magicDevicesManager) {
  /**
   * @api {get} /api/v1/service/magic-devices/devices Get Magic Devices
   * @apiName getDevices
   * @apiGroup MagicDevices
   */
  async function getDevices(req, res) {
    const devices = await magicDevicesManager.getDevices();
    logger.debug("the front called, returning " + JSON.stringify(devices));
    res.json(devices);
  }

  return {
    'get /api/v1/service/magic-devices/devices': {
      authenticated: true,
      controller: asyncMiddleware(getDevices),
    },
  };
};
