const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const logger = require('../../../utils/logger');

module.exports = function magicDevicesController(magicDevicesManager) {
  /**
   * @api {get} /api/v1/service/magic-devices/devices Get Magic Devices
   * @apiName getDevices
   * @apiGroup MagicDevices
   */
  async function getDevices(req, res) {
    console.error("client called getDevices")
    const devices = await magicDevicesManager.getDevices();
    //console.log("devices: " + JSON.stringify(devices))
    res.json(devices);
  }

  /**
   * @api {get} /api/v1/service/magic-devices/scan Start a scan and return devices
   * @apiName scan
   * @apiGroup MagicDevices
   */
  async function scan(req, res) {
    console.error("client called scan")
    const result = await magicDevicesManager.scan();
    res.json(result);
  }

  return {
    'get /api/v1/service/magic-devices/devices': {
      authenticated: true,
      controller: asyncMiddleware(getDevices),
    },
    'get /api/v1/service/magic-devices/scan': {
      authenticated: true,
      controller: asyncMiddleware(scan),
    },
  };
};
