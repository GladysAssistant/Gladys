const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function ZwaveController(gladys, zwaveManager, serviceId) {
  /**
   * @api {get} /api/v1/service/zwavejs2mqtt/node Get Zwave nodes
   * @apiName getNodes
   * @apiGroup Zwavejs2mqtt
   */
  async function getNodes(req, res) {
    const nodes = zwaveManager.getNodes();
    res.json(nodes);
  }

  /**
   * @api {get} /api/v1/service/zwavejs2mqtt/status Get Zwave Status
   * @apiName getStatus
   * @apiGroup Zwavejs2mqtt
   */
  async function getStatus(req, res) {
    const status = await zwaveManager.getStatus();
    res.json(status);
  }

  /**
   * @api {get} /api/v1/service/zwavejs2mqtt/configuration Get Zwave configuration
   * @apiName getConfiguration
   * @apiGroup Zwavejs2mqtt
   */
  async function getConfiguration(req, res) {
    const configuration = await zwaveManager.getConfiguration();
    res.json(configuration);
  }

  /**
   * @api {post} /api/v1/service/zwavejs2mqtt/configuration Update configuration
   * @apiName updateConfiguration
   * @apiGroup Zwavejs2mqtt
   */
  async function updateConfiguration(req, res) {
    const result = await zwaveManager.updateConfiguration(req.body);
    res.json({
      success: result,
    });
  }

  /**
   * @api {post} /api/v1/service/zwavejs2mqtt/connect Connect
   * @apiName connect
   * @apiGroup Zwavejs2mqtt
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
   * @api {post} /api/v1/service/zwavejs2mqtt/disconnect Disconnect
   * @apiName disconnect
   * @apiGroup Zwavejs2mqtt
   */
  async function disconnect(req, res) {
    zwaveManager.disconnect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/zwavejs2mqtt/neighbor Get Zwave node neighbors
   * @apiName getNodeNeighbors
   * @apiGroup Zwavejs2mqtt
   */
  async function getNodeNeighbors(req, res) {
    const nodes = await zwaveManager.getNodeNeighbors();
    res.json(nodes);
  }

  /**
   * @api {post} /api/v1/service/zwavejs2mqtt/heal Heal Network
   * @apiName healNetwork
   * @apiGroup Zwavejs2mqtt
   */
  async function healNetwork(req, res) {
    zwaveManager.healNetwork();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zwavejs2mqtt/node/add Add Node
   * @apiName addNode
   * @apiGroup Zwavejs2mqtt
   */
  async function addNode(req, res) {
    zwaveManager.addNode(req.body.secure);
    res.json({
      success: true,
    });
  }
  /**
   * @api {post} /api/v1/service/zwavejs2mqtt/node/remove Remove Node
   * @apiName removeNode
   * @apiGroup Zwavejs2mqtt
   */
  async function removeNode(req, res) {
    zwaveManager.removeNode();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zwavejs2mqtt/values/refresh Refresh values
   * @apiName refreshValues
   * @apiGroup Zwavejs2mqtt
   */
  async function refreshValues(req, res) {
    zwaveManager.refreshValues(req.body.nodeId);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zwavejs2mqtt/info/refresh Refresh info
   * @apiName refreshValues
   * @apiGroup Zwavejs2mqtt
   */
  async function refreshInfo(req, res) {
    zwaveManager.refreshInfo(req.body.nodeId);
    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/zwavejs2mqtt/node': {
      authenticated: true,
      controller: asyncMiddleware(getNodes),
    },
    'get /api/v1/service/zwavejs2mqtt/neighbor': {
      authenticated: true,
      controller: asyncMiddleware(getNodeNeighbors),
    },
    'get /api/v1/service/zwavejs2mqtt/status': {
      authenticated: false,
      controller: asyncMiddleware(getStatus),
    },
    'get /api/v1/service/zwavejs2mqtt/configuration': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
    'post /api/v1/service/zwavejs2mqtt/configuration': {
      authenticated: true,
      controller: asyncMiddleware(updateConfiguration),
    },
    'post /api/v1/service/zwavejs2mqtt/connect': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/zwavejs2mqtt/disconnect': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(disconnect),
    },
    'post /api/v1/service/zwavejs2mqtt/heal': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(healNetwork),
    },
    'post /api/v1/service/zwavejs2mqtt/values/refresh': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(refreshValues),
    },
    'post /api/v1/service/zwavejs2mqtt/info/refresh': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(refreshInfo),
    },
    'post /api/v1/service/zwavejs2mqtt/node/add': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(addNode),
    },
    'post /api/v1/service/zwavejs2mqtt/node/remove': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(removeNode),
    },
  };
};
