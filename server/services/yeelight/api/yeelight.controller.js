const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function YeelightController(yeelightHandler) {
  /**
   * @api {get} /api/v1/service/yeelight/discover Start a network scan and return array of Yeelight devices.
   * @apiName discover
   * @apiGroup Yeelight
   */
  async function discover(req, res) {
    const devices = await yeelightHandler.discover();
    res.json(devices);
  }

  return {
    'get /api/v1/service/yeelight/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
  };
};
