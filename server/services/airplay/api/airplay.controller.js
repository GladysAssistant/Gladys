const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function AirplayController(airplayHandler) {
  /**
   * @api {get} /api/v1/service/airplay/discover Retrieve Airplay devices from local network
   * @apiName discover
   * @apiGroup Airplay
   */
  async function discover(req, res) {
    const devices = await airplayHandler.scan();
    res.json(devices);
  }

  return {
    'get /api/v1/service/airplay/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
  };
};
