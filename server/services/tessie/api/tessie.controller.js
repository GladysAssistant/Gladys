const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function TessieController(tessieHandler) {
  /**
   * @api {get} /api/v1/service/tessie/configuration Get Tessie Configuration.
   * @apiName getConfiguration
   * @apiGroup Tessie
   */
  async function getConfiguration(req, res) {
    const configuration = await tessieHandler.getConfiguration();
    res.json(configuration);
  }

  /**
   * @api {get} /api/v1/service/tessie/status Get Tessie Status.
   * @apiName getStatus
   * @apiGroup Tessie
   */
  async function getStatus(req, res) {
    const result = await tessieHandler.getStatus();
    res.json(result);
  }

  /**
   * @api {post} /api/v1/service/tessie/configuration Save Tessie Configuration.
   * @apiName saveConfiguration
   * @apiGroup Tessie
   */
  async function saveConfiguration(req, res) {
    const result = await tessieHandler.saveConfiguration(req.body);
    res.json({
      success: result,
    });
  }

  /**
   * @api {post} /api/v1/service/tessie/status save Tessie connection status
   * @apiName saveStatus
   * @apiGroup Tessie
   */
  async function saveStatus(req, res) {
    const result = await tessieHandler.saveStatus(req.body);
    res.json({
      success: result,
    });
  }

  /**
   * @api {post} /api/v1/service/tessie/connect Connect tessie
   * @apiName connect
   * @apiGroup Tessie
   */
  async function connect(req, res) {
    await tessieHandler.getConfiguration();
    const result = await tessieHandler.connect();
    res.json(result);
  }

  /**
   * @api {post} /api/v1/service/tessie/disconnect Disconnect tessie
   * @apiName disconnect
   * @apiGroup Tessie
   */
  async function disconnect(req, res) {
    await tessieHandler.disconnect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/tessie/discover Discover tessie devices from API.
   * @apiName discover
   * @apiGroup Tessie
   */
  async function discover(req, res) {
    let devices;
    if (!tessieHandler.discoveredDevices || req.query.refresh === 'true') {
      devices = await tessieHandler.discoverDevices();
    } else {
      devices = tessieHandler.discoveredDevices.filter((device) => {
        const existInGladys = tessieHandler.gladys.stateManager.get('deviceByExternalId', device.external_id);
        return existInGladys === null;
      });
    }
    res.json(devices);
  }

  return {
    'get /api/v1/service/tessie/configuration': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
    'post /api/v1/service/tessie/configuration': {
      authenticated: true,
      controller: asyncMiddleware(saveConfiguration),
    },
    'get /api/v1/service/tessie/status': {
      authenticated: true,
      controller: asyncMiddleware(getStatus),
    },
    'post /api/v1/service/tessie/status': {
      authenticated: true,
      controller: asyncMiddleware(saveStatus),
    },
    'post /api/v1/service/tessie/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/tessie/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
    'get /api/v1/service/tessie/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
  };
};
