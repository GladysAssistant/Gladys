const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function NetatmoController(netatmoManager) {
  /**
   * @api {post} /api/v1/service/netatmo/connect Connect NETATMO connection
   * @apiName connect
   * @apiGroup Netatmo
   */
  async function connect(req, res) {
    const result = await netatmoManager.connect();
    res.json({
      success: result,
    });
  }

  /**
   * @api {post} /api/v1/service/netatmo/disconnect Disconnect NETATMO
   * @apiName disconnect
   * @apiGroup Netatmo
   */
  async function disconnect(req, res) {
    const result = await netatmoManager.disconnect();
    res.json({
      success: result,
    });
  }

  /**
   * @api {get} /api/v1/service/netatmo/sensor Get Netatmo sensors
   * @apiName getSensors
   * @apiGroup Netatmo
   */
  async function getSensors(req, res) {
    const sensors = await netatmoManager.getSensors();
    res.json(sensors);
  }

  return {
    'post /api/v1/service/netatmo/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/netatmo/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
    'get /api/v1/service/netatmo/sensor': {
      authenticated: true,
      controller: asyncMiddleware(getSensors),
    },
  };
};
