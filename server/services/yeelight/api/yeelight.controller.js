const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function YeelightController(yeelightHandler) {
  /**
   * @api {get} /api/v1/service/yeelight/scan Start a scan and return array of new Yeelight devices.
   * @apiName scan
   * @apiGroup Yeelight
   */
  async function scan(req, res) {
    const devices = await yeelightHandler.scan();
    res.json(devices);
  }

  return {
    'get /api/v1/service/yeelight/scan': {
      authenticated: true,
      controller: asyncMiddleware(scan),
    },
  };
};
