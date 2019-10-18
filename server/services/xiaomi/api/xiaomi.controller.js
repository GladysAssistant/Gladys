const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function xiaomiController(xiaomiManager) {
  /**
   * @api {get} /api/v1/service/xiaomi/sensor Get Xiaomi sensors
   * @apiName getSensors
   * @apiGroup Xiaomi
   */
  async function getSensors(req, res) {
    const sensors = await xiaomiManager.getSensors();
    res.json(sensors);
  }

  return {
    'get /api/v1/service/xiaomi/sensor': {
      authenticated: true,
      controller: asyncMiddleware(getSensors),
    },
  };
};
