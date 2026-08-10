const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function HomeKitController(homekitHandler) {
  /**
   * @api {get} /api/v1/service/homekit/reload Restart HomeKit bridge
   * @apiName reload
   * @apiGroup HomeKit
   */
  async function reload(req, res) {
    await homekitHandler.createBridge();
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/homekit/reset Reset HomeKit bridge
   * @apiName reset
   * @apiGroup HomeKit
   */
  async function reset(req, res) {
    await homekitHandler.resetBridge();
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/homekit/device Get HomeKit compatible devices
   * @apiName getDevices
   * @apiGroup HomeKit
   */
  async function getDevices(req, res) {
    const devices = await homekitHandler.getCompatibleDevices();
    res.json(devices.map(({ name, selector }) => ({ name, selector })));
  }

  return {
    'get /api/v1/service/homekit/device': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(getDevices),
    },
    'get /api/v1/service/homekit/reload': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(reload),
    },
    'get /api/v1/service/homekit/reset': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(reset),
    },
  };
};
