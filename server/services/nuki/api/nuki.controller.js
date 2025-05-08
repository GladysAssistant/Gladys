const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function NukiController(nukiHandler) {
  /**
   * @api {get} /api/v1/service/nuki/status Get Nuki status
   * @apiName getStatus
   * @apiGroup Nuki
   */
  async function getStatus(req, res) {
    const response = nukiHandler.getStatus();
    res.json(response);
  }

  /**
   * @api {get} /api/v1/service/nuki/config Get Nuki configuration
   * @apiName getConfiguration
   * @apiGroup Nuki
   */
  async function getConfiguration(req, res) {
    const config = await nukiHandler.getConfiguration();
    res.json(config);
  }

  /**
   * @api {post} /api/v1/service/nuki/config Save Nuki configuration
   * @apiName saveConfiguration
   * @apiGroup Nuki
   */
  async function saveConfiguration(req, res) {
    await nukiHandler.saveConfiguration(req.body);
    res.json({ success: true });
  }

  /**
   * @api {get} /api/v1/service/nuki/discover/:protocol Get discovered Nuki devices over selected protocol
   * @apiName discover
   * @apiGroup Nuki
   */
  function discover(req, res) {
    res.json(nukiHandler.getDiscoveredDevices(req.params.protocol));
  }

  /**
   * @api {post} /api/v1/service/nuki/discover/:protocol Discover Nuki devices over selected protocol.
   * @apiName scan
   * @apiGroup Nuki
   */
  function scan(req, res) {
    nukiHandler.scan(req.params.protocol, req.body);
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/nuki/connect Connect to Nuki Web service.
   * @apiName connect
   * @apiGroup Nuki
   */
  function connect(req, res) {
    nukiHandler.getHandler('http').connect();
    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/nuki/status': {
      authenticated: true,
      controller: asyncMiddleware(getStatus),
    },
    'get /api/v1/service/nuki/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'get /api/v1/service/nuki/config': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
    'post /api/v1/service/nuki/config': {
      authenticated: true,
      controller: asyncMiddleware(saveConfiguration),
    },
    'get /api/v1/service/nuki/discover/:protocol': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
    'post /api/v1/service/nuki/discover/:protocol': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(scan),
    },
  };
};
