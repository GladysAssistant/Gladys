module.exports = function xiaomiController(gladys, xiaomiManager, serviceId) {
  /**
   * @api {get} /api/v1/service/xiaomi/sensorTh Get Xiaomi sensor temperature
   * @apiName getSensorTh
   * @apiGroup Xiaomi
   */
  async function getSensorTh(req, res) {
    const sensorTh = await xiaomiManager.getSensorTh();
    res.json(sensorTh);
  }

  /**
   * @api {get} /api/v1/service/xiaomi/sensorMagnet Get Xiaomi sensor magnet
   * @apiName getSensorMagnet
   * @apiGroup Xiaomi
   */
  async function getSensorMagnet(req, res) {
    const sensorMagnet = await xiaomiManager.getSensorMagnet();
    res.json(sensorMagnet);
  }

  return {
    'get /api/v1/service/xiaomi/sensorTh': {
      authenticated: true,
      controller: getSensorTh,
    },
    'get /api/v1/service/xiaomi/sensorMagnet': {
      authenticated: true,
      controller: getSensorMagnet,
    },
  };
};
