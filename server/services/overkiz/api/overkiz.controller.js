const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function OverkizController(overkizHandler) {
  /**
   * @api {post} /api/v1/service/overkiz/connect Connect to overkiz cloud account.
   * @apiName save
   * @apiGroup overkiz
   */
  async function connect(req, res) {
    await overkizHandler.connect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/overkiz/status Get overkiz connection status.
   * @apiName status
   * @apiGroup overkiz
   */
  async function status(req, res) {
    const response = overkizHandler.status();
    res.json(response);
  }

  /**
   * @api {get} /api/v1/service/overkiz/discover Retrieve overkiz devices from cloud.
   * @apiName discover
   * @apiGroup overkiz
   */
  async function getDevices(req, res) {
    const devices = await overkizHandler.getOverkizDevices();
    res.json(devices);
  }

  /**
   * @api {post} /api/v1/service/overkiz/discover Scan for overkiz devices from cloud.
   * @apiName discover
   * @apiGroup overkiz
   */
  async function discoverDevices(req, res) {
    await overkizHandler.syncOverkizDevices();
    const devices = await overkizHandler.getOverkizDevices();
    res.json(devices);
  }

  return {
    'post /api/v1/service/overkiz/connect': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(connect),
    },
    'get /api/v1/service/overkiz/status': {
      authenticated: true,
      controller: status,
    },
    'get /api/v1/service/overkiz/discover': {
      authenticated: true,
      controller: asyncMiddleware(getDevices),
    },
    'post /api/v1/service/overkiz/discover': {
      authenticated: true,
      controller: asyncMiddleware(discoverDevices),
    },
  };
};
