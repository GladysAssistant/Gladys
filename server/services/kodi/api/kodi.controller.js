const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function kodiController(kodiHandler) {
  /**
   * @api {get} /api/v1/service/kodi/ping Ping Kodi media center.
   * @apiName ping
   * @apiGroup Kodi
   */
  async function ping(req, res) {
    await kodiHandler.pingKodi();
  }

  return {
    'get /api/v1/service/kodi/ping': {
      authenticated: true,
      controller: asyncMiddleware(ping),
    },
  };
};
