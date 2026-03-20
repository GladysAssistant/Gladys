const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const logger = require('../../../utils/logger');

module.exports = function MatterbridgeController(gladys, matterbridgeManager) {
  /**
   * @api {get} /api/v1/service/matterbridge/status Get matterbridge connection status
   * @apiName status
   * @apiGroup Matterbridge
   */
  async function status(req, res) {
    logger.debug('Get status');
    const response = await matterbridgeManager.status();
    res.json(response);
  }

  /**
   * @api {post} /api/v1/service/matterbridge/connect Connect
   * @apiName connect
   * @apiGroup Matterbridge
   */
  async function connect(req, res) {
    logger.debug('Entering connect step');
    await matterbridgeManager.init();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/matterbridge/start Install & start Matterbridge container.
   * @apiName installMatterbridgeContainer
   * @apiGroup Matterbridge
   */
  async function installMatterbridgeContainer(req, res) {
    logger.debug('Install Matterbridge container');
    await matterbridgeManager.installContainer();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/matterbridge/disconnect Disconnect
   * @apiName disconnect
   * @apiGroup Matterbridge
   */
  async function disconnect(req, res) {
    logger.debug('Entering disconnect step');
    await matterbridgeManager.disconnect();
    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/matterbridge/status': {
      authenticated: true,
      controller: asyncMiddleware(status),
    },
    'post /api/v1/service/matterbridge/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/matterbridge/start': {
      authenticated: true,
      controller: asyncMiddleware(installMatterbridgeContainer),
    },
    'post /api/v1/service/matterbridge/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
  };
};
