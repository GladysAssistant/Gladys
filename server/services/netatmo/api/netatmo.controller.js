const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function NetatmoController(netatmoHandler) {
  /**
   * @api {get} /api/v1/service/netatmo/config Get Netatmo Configuration.
   * @apiName getConfiguration
   * @apiGroup Netatmo
   */
  async function getConfiguration(req, res) {
    const configuration = await netatmoHandler.getConfiguration();
    res.json(configuration);
  }

  /**
   * @api {get} /api/v1/service/netatmo/status Get Netatmo Status.
   * @apiName getStatus
   * @apiGroup Netatmo
   */
  async function getStatus(req, res) {
    const result = await netatmoHandler.getStatus();
    res.json(result);
  }

  /**
   * @api {post} /api/v1/service/netatmo/configuration Save Netatmo Configuration.
   * @apiName saveConfiguration
   * @apiGroup Netatmo
   */
  async function saveConfiguration(req, res) {
    const result = await netatmoHandler.saveConfiguration(req.body);
    res.json({
      success: result,
    });
  }

  /**
   * @api {post} /api/v1/service/netatmo/status save Netatmo connection status
   * @apiName saveStatus
   * @apiGroup Netatmo
   */
  async function saveStatus(req, res) {
    const result = await netatmoHandler.saveStatus(req.body);
    res.json({
      success: result,
    });
  }

  /**
   * @api {post} /api/v1/service/netatmo/connect Connect netatmo
   * @apiName connect
   * @apiGroup Netatmo
   */
  async function connect(req, res) {
    await netatmoHandler.getConfiguration();
    res.json(await netatmoHandler.connect());
  }

  /**
   * @api {post} /api/v1/service/netatmo/token Retrieve access and refresh Tokens netatmo with code of return
   * @apiName retrieveTokens
   * @apiGroup Netatmo
   */
  async function retrieveTokens(req, res) {
    await netatmoHandler.getConfiguration();
    res.json(await netatmoHandler.retrieveTokens(req.body));
  }

  /**
   * @api {post} /api/v1/service/netatmo/disconnect Disconnect netatmo
   * @apiName disconnect
   * @apiGroup Netatmo
   */
  async function disconnect(req, res) {
    await netatmoHandler.disconnect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/netatmo/discover Retrieve netatmo devices from API.
   * @apiName discover
   * @apiGroup Netatmo
   */
  async function discover(req, res) {
    let devices;
    if (!netatmoHandler.discoveredDevices) {
      devices = await netatmoHandler.discoverDevices();
    } else {
      devices = netatmoHandler.discoveredDevices.filter((device) => {
        const existInGladys = netatmoHandler.gladys.stateManager.get('deviceByExternalId', device.external_id);
        return existInGladys === null;
      });
    }
    res.json(devices);
  }

  /**
   * @api {get} /api/v1/service/netatmo/device Retrieve netatmo devices from API.
   * @apiName refreshDiscover
   * @apiGroup Netatmo
   */
  async function refreshDiscover(req, res) {
    const devices = await netatmoHandler.discoverDevices();
    res.json(devices);
  }

  return {
    'get /api/v1/service/netatmo/config': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
    'post /api/v1/service/netatmo/configuration': {
      authenticated: true,
      controller: asyncMiddleware(saveConfiguration),
    },
    'get /api/v1/service/netatmo/status': {
      authenticated: true,
      controller: asyncMiddleware(getStatus),
    },
    'post /api/v1/service/netatmo/status': {
      authenticated: true,
      controller: asyncMiddleware(saveStatus),
    },
    'post /api/v1/service/netatmo/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/netatmo/token': {
      authenticated: true,
      controller: asyncMiddleware(retrieveTokens),
    },
    'post /api/v1/service/netatmo/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
    'get /api/v1/service/netatmo/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
    'get /api/v1/service/netatmo/device': {
      authenticated: true,
      controller: asyncMiddleware(refreshDiscover),
    },
  };
};
