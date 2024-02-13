const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function ZwaveJSUIController(zwaveJSUIHandler) {
  /**
   * @api {post} /api/v1/service/zwavejs-ui/discover Start a new discovery of Z-Wave devices
   * @apiName discover
   * @apiGroup ZwaveJSUI
   */
  function discover(req, res) {
    zwaveJSUIHandler.scan();
    res.json({ success: true });
  }
  /**
   * @api {post} /api/v1/service/zwavejs-ui/configuration Save configuration
   * @apiName saveConfiguration
   * @apiGroup ZwaveJSUI
   */
  async function saveConfiguration(req, res) {
    await zwaveJSUIHandler.saveConfiguration(req.body);
    res.json({ success: true });
  }

  /**
   * @api {get} /api/v1/service/zwavejs-ui/configuration Get configuration
   * @apiName getConfiguration
   * @apiGroup ZwaveJSUI
   */
  async function getConfiguration(req, res) {
    const config = await zwaveJSUIHandler.getConfiguration();
    res.json(config);
  }
  /**
   * @api {post} /api/v1/service/zwavejs-ui/connect Connect to MQTT broker
   * @apiName connect
   * @apiGroup ZwaveJSUI
   */
  async function connect(req, res) {
    await zwaveJSUIHandler.connect();
    res.json({ success: true });
  }

  /**
   * @api {get} /api/v1/service/zwavejs-ui/node Connect to MQTT broker
   * @apiName getNodes
   * @apiGroup ZwaveJSUI
   */
  function getNodes(req, res) {
    res.json(zwaveJSUIHandler.devices);
  }

  /**
   * @api {get} /api/v1/service/zwavejs-ui/status Get MQTT Status
   * @apiName getStatus
   * @apiGroup ZwaveJSUI
   */
  function getStatus(req, res) {
    res.json({
      connected: zwaveJSUIHandler.connected,
      configured: zwaveJSUIHandler.configured,
    });
  }

  return {
    'post /api/v1/service/zwavejs-ui/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
    'post /api/v1/service/zwavejs-ui/configuration': {
      authenticated: true,
      controller: asyncMiddleware(saveConfiguration),
    },
    'get /api/v1/service/zwavejs-ui/configuration': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
    'post /api/v1/service/zwavejs-ui/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'get /api/v1/service/zwavejs-ui/node': {
      authenticated: true,
      controller: asyncMiddleware(getNodes),
    },
    'get /api/v1/service/zwavejs-ui/status': {
      authenticated: true,
      controller: asyncMiddleware(getStatus),
    },
  };
};
