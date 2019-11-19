const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const logger = require('../../../utils/logger');

module.exports = function magicDevicesController(magicDevicesManager) {
  /**
   * @api {get} /api/v1/service/magic-devices/devices Get Magic Devices
   * @apiName getDevices
   * @apiGroup MagicDevices
   */
  async function getDevices(req, res) {
    const devices = await magicDevicesManager.getDevices();

    console.log("devices: " + JSON.stringify(devices))

    console.error("client called")
    res.json(devices);
  }

  /**
   * @api {post} /api/v1/service/magic-devices/set Set a Magic Devices value
   * @apiName set
   * @apiParam {String} serial Serial number of the bridge
   * @apiGroup PhilipsHue
   */
  // async function setValue(req, res) {
  //   const bridge = await philipsHueLightHandler.configureBridge(req.body.serial);
  //   res.json(bridge);
  // }

  return {
    'get /api/v1/service/magic-devices/devices': {
      authenticated: true,
      controller: asyncMiddleware(getDevices),
    },
  };
};
