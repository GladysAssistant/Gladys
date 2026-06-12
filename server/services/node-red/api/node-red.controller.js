const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const logger = require('../../../utils/logger');

module.exports = function NodeRedController(gladys, nodeRedManager) {
  /**
   * @api {get} /api/v1/service/node-red/status Get node-red connection status
   * @apiName status
   * @apiGroup Node-RED
   */
  async function status(req, res) {
    logger.debug('Get status');
    const response = await nodeRedManager.status();
    res.json(response);
  }

  /**
   * @api {post} /api/v1/service/node-red/connect Connect
   * @apiName connect
   * @apiGroup Node-RED
   */
  async function connect(req, res) {
    logger.debug('Entering connect step');
    await nodeRedManager.init();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/node-red/start Install & start Node-RED container.
   * @apiName installNodeRedContainer
   * @apiGroup Node-RED
   */
  async function installNodeRedContainer(req, res) {
    logger.debug('Install Node-RED container');
    await nodeRedManager.installContainer();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/node-red/disconnect Disconnect
   * @apiName disconnect
   * @apiGroup Node-RED
   */
  async function disconnect(req, res) {
    logger.debug('Entering disconnect step');
    await nodeRedManager.disconnect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/node-red/configuration Get Node-RED configuration
   * @apiName getConfiguration
   * @apiGroup Node-RED
   */
  async function getConfiguration(req, res) {
    logger.debug('Get Node-RED configuration');
    const configuration = await nodeRedManager.getConfiguration();
    res.json({
      dockerNodeRedVersion: configuration.dockerNodeRedVersion,
      availableMajorVersions: configuration.availableMajorVersions,
    });
  }

  /**
   * @api {post} /api/v1/service/node-red/configuration Update Node-RED major version
   * @apiName updateConfiguration
   * @apiGroup Node-RED
   */
  async function updateConfiguration(req, res) {
    logger.debug('Update Node-RED configuration');
    const { dockerNodeRedVersion } = req.body || {};
    const configuration = await nodeRedManager.updateMajorVersion(dockerNodeRedVersion);
    res.json({
      dockerNodeRedVersion: configuration.dockerNodeRedVersion,
      availableMajorVersions: configuration.availableMajorVersions,
    });
  }

  return {
    'get /api/v1/service/node-red/status': {
      authenticated: true,
      controller: asyncMiddleware(status),
    },
    'post /api/v1/service/node-red/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/node-red/start': {
      authenticated: true,
      controller: asyncMiddleware(installNodeRedContainer),
    },
    'post /api/v1/service/node-red/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
    'get /api/v1/service/node-red/configuration': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
    'post /api/v1/service/node-red/configuration': {
      authenticated: true,
      controller: asyncMiddleware(updateConfiguration),
    },
  };
};
