const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function NetatmoController(netatmoHandler) {
  /**
   * @api {get} /api/v1/service/tessie/configuration Get Tessie Configuration.
   * @apiName getConfiguration
   * @apiGroup Tessie
   */
  async function getConfiguration(req, res) {
    const configuration = await netatmoHandler.getConfiguration();
    res.json(configuration);
  }

  /**
   * @api {get} /api/v1/service/tessie/status Get Tessie Status.
   * @apiName getStatus
   * @apiGroup Tessie
   */
  async function getStatus(req, res) {
    const result = await netatmoHandler.getStatus();
    res.json(result);
  }

  /**
   * @api {post} /api/v1/service/tessie/configuration Save Tessie Configuration.
   * @apiName saveConfiguration
   * @apiGroup Tessie
   */
  async function saveConfiguration(req, res) {
    const result = await netatmoHandler.saveConfiguration(req.body);
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
    const result = await netatmoHandler.saveStatus(req.body);
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
    await netatmoHandler.getConfiguration();
    const result = await netatmoHandler.connect();
    res.json(result);
  }

  /**
   * @api {post} /api/v1/service/tessie/token Retrieve access and refresh Tokens tessie with code of return
   * @apiName retrieveTokens
   * @apiGroup Tessie
   */
  async function retrieveTokens(req, res) {
    await netatmoHandler.getConfiguration();
    const result = await netatmoHandler.retrieveTokens(req.body);
    res.json(result);
  }

  /**
   * @api {post} /api/v1/service/tessie/disconnect Disconnect tessie
   * @apiName disconnect
   * @apiGroup Tessie
   */
  async function disconnect(req, res) {
    await netatmoHandler.disconnect();
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
    if (!netatmoHandler.discoveredDevices || req.query.refresh === 'true') {
      devices = await netatmoHandler.discoverDevices();
    } else {
      devices = netatmoHandler.discoveredDevices.filter((device) => {
        const existInGladys = netatmoHandler.gladys.stateManager.get('deviceByExternalId', device.external_id);
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
    'post /api/v1/service/tessie/token': {
      authenticated: true,
      controller: asyncMiddleware(retrieveTokens),
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
