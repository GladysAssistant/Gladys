const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

module.exports = function ZwaveController(gladys, zwaveManager, serviceId) {
  /**
   * @api {get} /api/v1/service/zwave/node Get Zwave nodes
   * @apiName getNodes
   * @apiGroup Zwave
   */
  async function getNodes(req, res) {
    const nodes = zwaveManager.getNodes();
    res.json(nodes);
  }

  /**
   * @api {post} /api/v1/service/zwave/connect Connect
   * @apiName connect
   * @apiGroup Zwave
   */
  async function connect(req, res) {
    const zwaveDriverPath = await gladys.variable.getValue('ZWAVE_DRIVER_PATH', serviceId);
    if (!zwaveDriverPath) {
      throw new ServiceNotConfiguredError('ZWAVE_DRIVER_PATH_NOT_FOUND');
    }
    zwaveManager.connect(zwaveDriverPath);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zwave/disconnect Disconnect
   * @apiName disconnect
   * @apiGroup Zwave
   */
  async function disconnect(req, res) {
    zwaveManager.disconnect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/zwave/neighbor Get Zwave node neighbors
   * @apiName getNodeNeighbors
   * @apiGroup Zwave
   */
  async function getNodeNeighbors(req, res) {
    const nodes = zwaveManager.getNodeNeighbors();
    res.json(nodes);
  }

  /**
   * @api {get} /api/v1/service/zwave/info Get Zwave Informations
   * @apiName getInfos
   * @apiGroup Zwave
   */
  async function getInfos(req, res) {
    const infos = zwaveManager.getInfos();
    res.json(infos);
  }

  /**
   * @api {get} /api/v1/service/zwave/status Get Zwave Status
   * @apiName getStatus
   * @apiGroup Zwave
   */
  async function getStatus(req, res) {
    res.json({
      connected: zwaveManager.connected,
      scanInProgress: zwaveManager.scanInProgress,
      ready: zwaveManager.ready,
    });
  }

  /**
   * @api {post} /api/v1/service/zwave/heal Heal Network
   * @apiName healNetwork
   * @apiGroup Zwave
   */
  async function healNetwork(req, res) {
    zwaveManager.healNetwork();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zwave/node/add Add Node
   * @apiName addNode
   * @apiGroup Zwave
   */
  async function addNode(req, res) {
    zwaveManager.addNode(req.body.secure);
    res.json({
      success: true,
    });
  }
  /**
   * @api {post} /api/v1/service/zwave/node/remove Remove Node
   * @apiName removeNode
   * @apiGroup Zwave
   */
  async function removeNode(req, res) {
    zwaveManager.removeNode(req.body.secure);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zwave/cancel Cancel ZWave command
   * @apiName cancelCommand
   * @apiGroup Zwave
   */
  async function cancelControllerCommand(req, res) {
    zwaveManager.cancelControllerCommand();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zwave/params/refresh Refresh params
   * @apiName refreshParams
   * @apiGroup Zwave
   */
  async function refreshNodeParams(req, res) {
    zwaveManager.refreshNodeParams();
    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/zwave/node': {
      authenticated: true,
      controller: asyncMiddleware(getNodes),
    },
    'get /api/v1/service/zwave/neighbor': {
      authenticated: true,
      controller: asyncMiddleware(getNodeNeighbors),
    },
    'get /api/v1/service/zwave/info': {
      authenticated: true,
      controller: asyncMiddleware(getInfos),
    },
    'get /api/v1/service/zwave/status': {
      authenticated: true,
      controller: asyncMiddleware(getStatus),
    },
    'post /api/v1/service/zwave/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/zwave/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
    'post /api/v1/service/zwave/heal': {
      authenticated: true,
      controller: asyncMiddleware(healNetwork),
    },
    'post /api/v1/service/zwave/params/refresh': {
      authenticated: true,
      controller: asyncMiddleware(refreshNodeParams),
    },
    'post /api/v1/service/zwave/node/add': {
      authenticated: true,
      controller: asyncMiddleware(addNode),
    },
    'post /api/v1/service/zwave/node/remove': {
      authenticated: true,
      controller: asyncMiddleware(removeNode),
    },
    'post /api/v1/service/zwave/cancel': {
      authenticated: true,
      controller: asyncMiddleware(cancelControllerCommand),
    },
  };
};
