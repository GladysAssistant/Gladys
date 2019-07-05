module.exports = function ZwaveController(gladys, xiaomiManager, serviceId) {
  /**
   * @api {get} /api/v1/service/zwave/node Get Zwave nodes
   * @apiName getNodes
   * @apiGroup Zwave
   */
  async function getSensorTh(req, res) {
    const sensorTh = await xiaomiManager.getSensorTh();
    res.send(sensorTh);
  }

  return {
    'get /api/v1/service/xiaomi/sensorTh': {
      authenticated: true,
      controller: getSensorTh,
    },
  };
};
