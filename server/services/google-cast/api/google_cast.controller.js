const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function GoogleCastController(googleCastHandler) {
  /**
   * @api {get} /api/v1/service/google-cast/discover Retrieve googleCast devices from local network
   * @apiName discover
   * @apiGroup GoogleCast
   */
  async function discover(req, res) {
    const devices = await googleCastHandler.scan();
    res.json(devices);
  }

  return {
    'get /api/v1/service/google-cast/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
  };
};
