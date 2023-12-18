const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function SonosController(sonosHandler) {
  /**
   * @api {get} /api/v1/service/sonos/discover Retrieve sonos devices from local network
   * @apiName discover
   * @apiGroup Sonos
   */
  async function discover(req, res) {
    const devices = await sonosHandler.scan();
    res.json(devices);
  }

  return {
    'get /api/v1/service/sonos/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
  };
};
