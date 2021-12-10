const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function WithingsController(withingsHandler) {
  /**
   * @description Init gladys devices with withings devices.
   * @api {post} /api/v1/service/withings/init Init gladys devices ith withings devices.
   * @apiName init
   * @apiGroup Withings
   */
  async function init(req, res) {
    const resultInit = await withingsHandler.init(req.user.id);
    res.json({
      success: true,
      result: resultInit,
    });
  }

  /**
   * @description Delete clientId and secret of withings oauth2 api.
   * @api {get} /api/v1/service/withings/deleteConfig Delete clientId and secret of withings oauth2 api.
   * @apiName deleteConfig
   * @apiGroup Withings
   */
  async function deleteConfig(req, res) {
    await withingsHandler.deleteVar('withings', req.user.id);
    await withingsHandler.deleteDevices();
    res.json({
      success: true,
    });
  }

  return {
    'post /api/v1/service/withings/init': {
      authenticated: true,
      controller: asyncMiddleware(init),
    },
    'get /api/v1/service/withings/deleteConfig': {
      authenticated: true,
      controller: asyncMiddleware(deleteConfig),
    },
  };
};
