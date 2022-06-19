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
   * @api {get} /api/v1/service/zwave/status Get Zwave Status
   * @apiName getStatus
   * @apiGroup Zwave
   */
  async function getStatus(req, res) {
    const status = await zwaveManager.getStatus();
    res.json(status);
  }

  /**
   * @api {get} /api/v1/service/zwave/configuration Get Zwave configuration
   * @apiName getConfiguration
   * @apiGroup Zwave
   */
  async function getConfiguration(req, res) {
    const configuration = await zwaveManager.getConfiguration();
    res.json(configuration);
  }

  /**
   * @api {post} /api/v1/service/zwave/configuration Update configuration
   * @apiName updateConfiguration
   * @apiGroup Zwave
   */
  async function updateConfiguration(req, res) {
    const result = await zwaveManager.updateConfiguration(req.body);
    res.json({
      success: result,
    });
  }

  /**
   * @api {post} /api/v1/service/zwave/connect Connect
   * @apiName connect
   * @apiGroup Zwave
   */
  async function connect(req, res) {
    if (zwaveManager.restartRequired) {
      zwaveManager.disconnect();
    }
    zwaveManager.connect();
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
    const nodes = await zwaveManager.getNodeNeighbors();
    res.json(nodes);
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
   * @api {post} /api/v1/service/zwave/values/refresh Refresh values
   * @apiName refreshValues
   * @apiGroup Zwave
   */
  async function refreshValues(req, res) {
    zwaveManager.refreshValues(req.body.nodeId);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zwave/info/refresh Refresh info
   * @apiName refreshValues
   * @apiGroup Zwave
   */
  async function refreshInfo(req, res) {
    zwaveManager.refreshInfo(req.body.nodeId);
    res.json({
      success: result,
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
    'get /api/v1/service/zwave/status': {
      authenticated: false,
      controller: asyncMiddleware(getStatus),
    },
    'get /api/v1/service/zwave/configuration': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
    'post /api/v1/service/zwave/configuration': {
      authenticated: true,
      controller: asyncMiddleware(updateConfiguration),
    },
    'post /api/v1/service/zwave/connect': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/zwave/disconnect': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(disconnect),
    },
    'post /api/v1/service/zwave/heal': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(healNetwork),
    },
    'post /api/v1/service/zwave/values/refresh': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(refreshValues),
    },
    'post /api/v1/service/zwave/info/refresh': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(refreshInfo),
    },
    'post /api/v1/service/zwave/node/add': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(addNode),
    },
    'post /api/v1/service/zwave/node/remove': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(removeNode),
    },
  };
};
