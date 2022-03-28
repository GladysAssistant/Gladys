const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function WithingsController(gladys, withingsHandler) {
  /**
   * @description Init gladys devices with withings devices.
   * @api {post} /api/v1/service/withings/init Init gladys devices with withings devices.
   * @apiName init
   * @apiGroup Withings
   */
  async function init(req, res) {
    const resultInit = await withingsHandler.init(req.user.id);
    res.json({
      withingsDevices: resultInit,
    });
  }

  /**
   * @description Delete client id, secret client of withings oauth2 api and al withings devices.
   * @api {get} /api/v1/service/withings/reset Delete clientId and secret of withings oauth2 api.
   * @apiName reset
   * @apiGroup Withings
   */
  async function reset(req, res) {
    await withingsHandler.deleteVar(req.user.id);
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
    'get /api/v1/service/withings/reset': {
      authenticated: true,
      controller: asyncMiddleware(reset),
    },
  };
};
