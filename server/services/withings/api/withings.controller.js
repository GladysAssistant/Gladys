const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function WithingsController(withingsHandler) {
  /**
   * @description Init gladys devices ith withings devices.
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
   * @description Save clientId and secretId of withings oauth2 api.
   * @api {post} /api/v1/service/withings/saveVar Save clientId and secretId of withings oauth2 api.
   * @apiName saveVar
   * @apiGroup Withings
   */
  async function saveVar(req, res) {
    const resultSaveVar = await withingsHandler.saveVar(
      req.body.clientId,
      req.body.secretId,
      req.body.integrationName,
      req.user.id,
    );
    res.json({
      success: true,
      result: resultSaveVar,
    });
  }

  /**
   * @description Delete clientId and secretId of withings oauth2 api.
   * @api {get} /api/v1/service/withings/deleteConfig Delete clientId and secretId of withings oauth2 api.
   * @apiName deleteConfig
   * @apiGroup Withings
   */
  async function deleteConfig(req, res) {
    await withingsHandler.deleteVar('withings', req.query.userId);
    await withingsHandler.deleteDevices();
    res.json({
      success: true,
    });
  }

  /**
   * @description Return the withings service id.
   * @api {get} /api/v1/service/withings/getServiceId Return the withings service id.
   * @apiName getServiceId
   * @apiGroup Withings
   */
  async function getServiceId(req, res) {
    const resultServiceId = await withingsHandler.getServiceId();
    res.json({
      success: true,
      result: resultServiceId,
    });
  }

  return {
    'post /api/v1/service/withings/init': {
      authenticated: true,
      controller: asyncMiddleware(init),
    },
    'post /api/v1/service/withings/saveVar': {
      authenticated: true,
      controller: asyncMiddleware(saveVar),
    },
    'get /api/v1/service/withings/deleteConfig': {
      authenticated: true,
      controller: asyncMiddleware(deleteConfig),
    },
    'get /api/v1/service/withings/getServiceId': {
      authenticated: true,
      controller: asyncMiddleware(getServiceId),
    },
  };
};
