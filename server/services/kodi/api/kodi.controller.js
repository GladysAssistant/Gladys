const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function kodiController(kodiHandler) {
  /**
   * @description check connection with host and port in device.
   * @api {get} /api/v1/service/kodi/testKodiConnection Test connection to Kodi Media Center
   * with host and port in device.
   * @apiName testKodiConnection
   * @apiGroup Kodi
   */
  async function testKodiConnection(req, res) {
    const testStatus = await kodiHandler.testKodiConnection(req.body);
    res.send(testStatus);
  }

  return {
    'post /api/v1/service/kodi/test': {
      authenticated: true,
      controller: asyncMiddleware(testKodiConnection),
    },
  };
};
