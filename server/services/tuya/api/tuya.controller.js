const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function TuyaController(tuyaManager) {
  /**
   * @api {get} /api/v1/service/tuya/discover Retrieve tuya devices from cloud.
   * @apiName discover
   * @apiGroup Tuya
   */
  async function discover(req, res) {
    const devices = await tuyaManager.discoverDevices();
    res.json(devices);
  }

  return {
    'get /api/v1/service/tuya/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
  };
};
