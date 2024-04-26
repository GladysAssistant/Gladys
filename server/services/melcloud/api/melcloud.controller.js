const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function MELCloudController(melCloudManager) {
  /**
   * @api {get} /api/v1/service/melcloud/discover Retrieve MELCloud devices from cloud.
   * @apiName discover
   * @apiGroup MELCloud
   */
  async function discover(req, res) {
    const devices = await melCloudManager.discoverDevices();
    res.json(devices);
  }

  return {
    'get /api/v1/service/melcloud/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
  };
};
