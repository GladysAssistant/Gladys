const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function SunSpecController(sunspecManager) {
  /**
   * @api {get} /api/v1/service/sunspec/node Get SunSpec nodes
   * @apiName getDevices
   * @apiGroup SunSpec
   */
  function getDevices(req, res) {
    const nodes = sunspecManager.getDevices(req.query);
    res.json(nodes);
  }

  /**
   * @api {get} /api/v1/service/sunspec/status Get SunSpec Status
   * @apiName getStatus
   * @apiGroup SunSpec
   */
  function getStatus(req, res) {
    const status = sunspecManager.getStatus();
    res.json(status);
  }

  /**
   * @api {get} /api/v1/service/sunspec/config Get SunSpec configuration
   * @apiName getConfiguration
   * @apiGroup SunSpec
   */
  async function getConfiguration(req, res) {
    const configuration = await sunspecManager.getConfiguration();
    res.json(configuration);
  }

  /**
   * @api {post} /api/v1/service/sunspec/config Update configuration
   * @apiName updateConfiguration
   * @apiGroup SunSpec
   */
  async function updateConfiguration(req, res) {
    await sunspecManager.updateConfiguration(req.body);
    await sunspecManager.disconnect();
    await sunspecManager.connect();
    const configuration = await sunspecManager.getConfiguration();
    sunspecManager.bdpvInit(configuration.bdpvActive);
    res.json(configuration);
  }

  /**
   * @api {post} /api/v1/service/sunspec/connect Connect
   * @apiName connect
   * @apiGroup SunSpec
   */
  async function connect(req, res) {
    await sunspecManager.connect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/sunspec/disconnect Disconnect
   * @apiName disconnect
   * @apiGroup SunSpec
   */
  async function disconnect(req, res) {
    await sunspecManager.disconnect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/sunspec/scan Scan SunSpec network
   * @apiName scanNetwork
   * @apiGroup SunSpec
   */
  async function scanNetwork(req, res) {
    await sunspecManager.scanNetwork();
    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/sunspec/discover': {
      authenticated: true,
      controller: asyncMiddleware(getDevices),
    },
    'post /api/v1/service/sunspec/discover': {
      authenticated: true,
      controller: asyncMiddleware(scanNetwork),
    },
    'get /api/v1/service/sunspec/status': {
      authenticated: false,
      controller: asyncMiddleware(getStatus),
    },
    'get /api/v1/service/sunspec/config': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
    'post /api/v1/service/sunspec/config': {
      authenticated: true,
      controller: asyncMiddleware(updateConfiguration),
    },
    'post /api/v1/service/sunspec/connect': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/sunspec/disconnect': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(disconnect),
    },
  };
};
