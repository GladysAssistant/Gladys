const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function AndroidTVController(androidTVHandler) {
  /**
   * @api {post} /api/v1/service/android-tv/code Send Android TV pairing code
   * @apiName code
   * @apiGroup Android TV
   */
  async function code(req, res) {
    await androidTVHandler.sendCode(req.body.device, req.body.code);
    res.json({
      success: true,
    });
  }

  return {
    'post /api/v1/service/android-tv/code': {
      authenticated: true,
      // admin: true,
      controller: asyncMiddleware(code),
    },
  };
};
