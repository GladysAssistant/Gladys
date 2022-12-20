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

  return {
    'get /api/v1/service/homekit/reload': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(reload),
    },
  };
};
