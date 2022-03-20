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
   * @description Poll withings devices (used to initialize feature state on gladys device creation).
   * @api {get} /api/v1/service/withings/poll/:device_selector Poll withings devices.
   * @apiName poll
   * @apiGroup Withings
   */
  async function poll(req, res) {
    if(req.params.device_selector){
      const deviceToPoll = await gladys.device.getBySelector(req.params.device_selector);
      await withingsHandler.poll(deviceToPoll);
    }
  }

  /**
   * @description Delete clientId and secret of withings oauth2 api.
   * @api {get} /api/v1/service/withings/deleteConfig Delete clientId and secret of withings oauth2 api.
   * @apiName deleteConfig
   * @apiGroup Withings
   */
  async function deleteConfig(req, res) {
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
    'get /api/v1/service/withings/deleteConfig': {
      authenticated: true,
      controller: asyncMiddleware(deleteConfig),
    },
    'get /api/v1/service/withings/poll/:device_selector': {
      authenticated: true,
      controller: asyncMiddleware(poll),
    },
  };
};
