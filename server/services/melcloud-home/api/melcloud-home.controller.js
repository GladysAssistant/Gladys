const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function MELCloudHomeController(melCloudHomeManager) {
  /**
   * @api {get} /api/v1/service/melcloud-home/discover Retrieve MELCloud Home devices from cloud.
   * @apiName discover
   * @apiGroup MELCloudHome
   */
  async function discover(req, res) {
    const devices = await melCloudHomeManager.discoverDevices();
    res.json(devices);
  }

  return {
    'get /api/v1/service/melcloud-home/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
  };
};
