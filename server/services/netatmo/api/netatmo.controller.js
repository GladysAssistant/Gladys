const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../utils/constants');
const { STATUS } = require('../lib/utils/netatmo.constants');

module.exports = function NetatmoController(netatmoHandler) {
  /**
   * @api {post} /api/v1/service/netatmo/connect Connect netatmo
   * @apiName connect
   * @apiGroup Netatmo
   */
  async function connect(req, res) {
    const configuration = await netatmoHandler.getConfiguration();
    const result = await netatmoHandler.connect(netatmoHandler, configuration);
    res.json({
      result,
    });
  }

  /**
   * @api {post} /api/v1/service/netatmo/getAccessToken Connect netatmo
   * @apiName getAccessToken
   * @apiGroup Netatmo
   */
  async function getAccessToken(req, res) {
    console.log(req.body)
    const configuration = await netatmoHandler.getConfiguration();
    const result = await netatmoHandler.getAccessToken(netatmoHandler, configuration, req.body);
    res.json({
      result,
    });
  }

  /**
   * @api {post} /api/v1/service/netatmo/disconnect Disconnect netatmo
   * @apiName disconnect
   * @apiGroup Netatmo
   */
  async function disconnect(req, res) {
    const result = await netatmoHandler.disconnect(netatmoHandler);
    res.json({
      success: result,
    });
  }

  return {
    'post /api/v1/service/netatmo/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/netatmo/getAccessToken': {
      authenticated: true,
      controller: asyncMiddleware(getAccessToken),
    },
    'post /api/v1/service/netatmo/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
  };
};
