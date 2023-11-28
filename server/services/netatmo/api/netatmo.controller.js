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
   * @api {post} /api/v1/service/netatmo/saveConfiguration Save Netatmo Configuration.
   * @apiName saveConfiguration
   * @apiGroup Netatmo
   */
  async function saveConfiguration(req, res) {
    const result = await netatmoHandler.saveConfiguration(netatmoHandler, req.body);
    res.json({
      success: result,
    });
  }

  /**
   * @api {get} /api/v1/service/netatmo/getStatus Get Netatmo Status.
   * @apiName getStatus
   * @apiGroup Netatmo
   */
  async function getStatus(req, res) {
    const status = await netatmoHandler.getStatus();
    res.json(status);
  }

  /**
   * @api {post} /api/v1/service/netatmo/saveStatus save Netatmo connection status
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
    const configuration = await netatmoHandler.getConfiguration();
    const result = await netatmoHandler.connect(netatmoHandler, configuration);
    res.json({
      result,
    });
  }

  /**
   * @api {post} /api/v1/service/netatmo/retrieveTokens Get access Tokens netatmo with code of return
   * @apiName retrieveTokens
   * @apiGroup Netatmo
   */
  async function retrieveTokens(req, res) {
    const configuration = await netatmoHandler.getConfiguration();
    const result = await netatmoHandler.retrieveTokens(netatmoHandler, configuration, req.body);
    res.json({
      result,
    });
  }

  /**
   * @api {post} /api/v1/service/netatmo/disconnect Disconnect netatmo
   * @apiName disconnect
   * @apiGroup Netatmo
   */
  async function disconnect(req, res) {
    const result = await netatmoHandler.disconnect(netatmoHandler);
    res.json({
      success: result,
    });
  }

  return {
    'get /api/v1/service/netatmo/config': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
    'post /api/v1/service/netatmo/saveConfiguration': {
      authenticated: true,
      controller: asyncMiddleware(saveConfiguration),
    },
    'get /api/v1/service/netatmo/getStatus': {
      authenticated: true,
      controller: asyncMiddleware(getStatus),
    },
    'post /api/v1/service/netatmo/saveStatus': {
      authenticated: true,
      controller: asyncMiddleware(saveStatus),
    },
    'post /api/v1/service/netatmo/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/netatmo/retrieveTokens': {
      authenticated: true,
      controller: asyncMiddleware(retrieveTokens),
    },
    'post /api/v1/service/netatmo/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
  };
};
