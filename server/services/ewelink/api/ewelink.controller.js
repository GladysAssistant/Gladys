const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function EwelinkController(eweLinkHandler) {
  /**
   * @api {post} /api/v1/service/ewelink/connect Connect to eWeLink cloud account.
   * @apiName save
   * @apiGroup Ewelink
   */
  async function connect(req, res) {
    await eweLinkHandler.connect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/ewelink/status Get eWeLink connection status.
   * @apiName status
   * @apiGroup Ewelink
   */
  async function status(req, res) {
    const response = eweLinkHandler.status();
    res.json(response);
  }

  /**
   * @api {get} /api/v1/service/ewelink/discover Retrieve eWelink devices from cloud.
   * @apiName discover
   * @apiGroup Ewelink
   */
  async function discover(req, res) {
    const devices = await eweLinkHandler.discover();
    res.json(devices);
  }

  return {
    'post /api/v1/service/ewelink/connect': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(connect),
    },
    'get /api/v1/service/ewelink/status': {
      authenticated: true,
      controller: status,
    },
    'get /api/v1/service/ewelink/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
  };
};
