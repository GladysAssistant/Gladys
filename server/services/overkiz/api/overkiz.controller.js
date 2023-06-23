const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function OverkizController(overkizManager) {
  /**
   * @api {get} /api/v1/service/overkiz/configuration Get Overkiz configuration
   * @apiName getConfiguration
   * @apiGroup Overkiz
   */
  async function getConfiguration(req, res) {
    const configuration = await overkizManager.getConfiguration();
    res.json(configuration);
  }

  /**
   * @api {post} /api/v1/service/overkiz/configuration Update Overkiz configuration
   * @apiName updateConfiguration
   * @apiGroup Overkiz
   */
  async function updateConfiguration(req, res) {
    const result = await overkizManager.updateConfiguration(req.body);
    res.json({
      success: result,
    });
  }

  /**
   * @api {post} /api/v1/service/overkiz/connect Connect to Overkiz cloud account.
   * @apiName save
   * @apiGroup Overkiz
   */
  async function connect(req, res) {
    await overkizManager.connect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/overkiz/disconnect Disconnect from Overkiz cloud account.
   * @apiName save
   * @apiGroup Overkiz
   */
  async function disconnect(req, res) {
    await overkizManager.disconnect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/overkiz/status Get Overkiz connection status.
   * @apiName status
   * @apiGroup Overkiz
   */
  function status(req, res) {
    const response = overkizManager.status();
    res.json(response);
  }

  /**
   * @api {get} /api/v1/service/overkiz/discover Retrieve overkiz devices from cloud.
   * @apiName discover
   * @apiGroup overkiz
   */
  async function getDevices(req, res) {
    const devices = await overkizManager.getOverkizDevices();
    res.json(devices);
  }

  /**
   * @api {post} /api/v1/service/overkiz/discover Scan for overkiz devices from cloud.
   * @apiName discover
   * @apiGroup overkiz
   */
  async function discoverDevices(req, res) {
    await overkizManager.syncOverkizDevices();
    const devices = await overkizManager.getOverkizDevices();
    res.json(devices);
  }

  return {
    'get /api/v1/service/overkiz/configuration': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
    'post /api/v1/service/overkiz/configuration': {
      authenticated: true,
      controller: asyncMiddleware(updateConfiguration),
    },
    'post /api/v1/service/overkiz/connect': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/overkiz/disconnect': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(disconnect),
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
