const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function TasmotaController(gladys, tasmotaManager) {
  /**
   * @api {get} /api/v1/service/tasmota/discover/:protocol Get discovered Tasmota devices over selected protocol
   * @apiName discover
   * @apiGroup Tasmota
   */
  async function discover(req, res) {
    const defaultElectricMeterDeviceFeatureId = await gladys.energyPrice.getDefaultElectricMeterFeatureId();
    res.json(tasmotaManager.getDiscoveredDevices(req.params.protocol, defaultElectricMeterDeviceFeatureId));
  }

  /**
   * @api {post} /api/v1/service/tasmota/discover/:protocol Discover Tasmota devices over selected protocol.
   * @apiName scan
   * @apiGroup Tasmota
   */
  function scan(req, res) {
    tasmotaManager.scan(req.params.protocol, req.body);
    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/tasmota/discover/:protocol': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
    'post /api/v1/service/tasmota/discover/:protocol': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(scan),
    },
  };
};
