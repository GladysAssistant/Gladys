const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function AndroidTVController(androidTVHandler) {
  /**
   * @api {post} /api/v1/service/android-tv/code Send Android TV pairing code
   * @apiName code
   * @apiGroup Android TV
   */
  async function code(req, res) {
    const result = await androidTVHandler.sendCode(req.body.device, req.body.code);
    res.json({
      success: result,
    });
  }

  /**
   * @api {post} /api/v1/service/android-tv/reconnect Start/restart Android TV connection
   * @apiName reconnect
   * @apiGroup Android TV
   */
  async function reconnect(req, res) {
    console.log('req.body.selector', req.body.selector)
    const device = await androidTVHandler.gladys.device.getBySelector(req.body.selector);
    await androidTVHandler.buildTV(device);
    res.json({
      success: true,
    });
  }

  return {
    'post /api/v1/service/android-tv/code': {
      authenticated: true,
      controller: asyncMiddleware(code),
    },
    'post /api/v1/service/android-tv/reconnect': {
      authenticated: true,
      controller: asyncMiddleware(reconnect),
    },
  };
};
