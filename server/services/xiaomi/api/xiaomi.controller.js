module.exports = function xiaomiController(xiaomiManager) {
  /**
   * @api {get} /api/v1/service/xiaomi Get Xiaomi sensor temperature
   * @apiName getTemperatureSensor
   * @apiGroup Xiaomi
   */
  async function getSensor(req, res) {
    const sensor = await xiaomiManager.getSensor();
    res.json(sensor);
  }

  return {
    'get /api/v1/service/xiaomi/sensor': {
      authenticated: true,
      controller: getSensor,
    },
  };
};
