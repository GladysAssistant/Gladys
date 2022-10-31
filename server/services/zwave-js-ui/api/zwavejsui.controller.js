const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function ZwaveController(gladys, zwaveJSUIManager, serviceId) {
  /**
   * @api {get} /api/v1/service/zwave-js-ui/node Get Zwave nodes
   * @apiName getNodes
   * @apiGroup ZwaveJSUI
   */
  async function getNodes(req, res) {
    const nodes = zwaveJSUIManager.getNodes();
    res.json(nodes);
  }

  /**
   * @api {get} /api/v1/service/zwave-js-ui/status Get Zwave Status
   * @apiName getStatus
   * @apiGroup ZwaveJSUI
   */
  async function getStatus(req, res) {
    const status = await zwaveJSUIManager.getStatus();
    res.json(status);
  }

  /**
   * @api {get} /api/v1/service/zwave-js-ui/configuration Get Zwave configuration
   * @apiName getConfiguration
   * @apiGroup ZwaveJSUI
   */
  async function getConfiguration(req, res) {
    const configuration = await zwaveJSUIManager.getConfiguration();
    res.json(configuration);
  }

  /**
   * @api {post} /api/v1/service/zwave-js-ui/configuration Update configuration
   * @apiName updateConfiguration
   * @apiGroup ZwaveJSUI
   */
  async function updateConfiguration(req, res) {
    const result = await zwaveJSUIManager.updateConfiguration(req.body);
    zwaveJSUIManager.connect();
    res.json({
      success: result,
    });
  }

  /**
   * @api {post} /api/v1/service/zwave-js-ui/connect Connect
   * @apiName connect
   * @apiGroup ZwaveJSUI
   */
  async function connect(req, res) {
    zwaveJSUIManager.connect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zwave-js-ui/disconnect Disconnect
   * @apiName disconnect
   * @apiGroup ZwaveJSUI
   */
  async function disconnect(req, res) {
    zwaveJSUIManager.disconnect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zwave-js-ui/heal Heal Zwave network
   * @apiName healNetwork
   * @apiGroup ZwaveJSUI
   */
  async function healNetwork(req, res) {
    const nodes = await zwaveJSUIManager.healNetwork();
    res.json(nodes);
  }

  /**
   * @api {post} /api/v1/service/zwave-js-ui/node/add Add Node
   * @apiName addNode
   * @apiGroup ZwaveJSUI
   */
  function addNode(req, res) {
    zwaveJSUIManager.addNode(req.body.secure);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zwave-js-ui/node/remove Remove Node
   * @apiName removeNode
   * @apiGroup ZwaveJSUI
   */
  function removeNode(req, res) {
    zwaveJSUIManager.removeNode();
    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/zwave-js-ui/node': {
      authenticated: true,
      controller: asyncMiddleware(getNodes),
    },
    'post /api/v1/service/zwave-js-ui/heal': {
      authenticated: true,
      controller: asyncMiddleware(healNetwork),
    },
    'get /api/v1/service/zwave-js-ui/status': {
      authenticated: false,
      controller: asyncMiddleware(getStatus),
    },
    'get /api/v1/service/zwave-js-ui/configuration': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
    'post /api/v1/service/zwave-js-ui/configuration': {
      authenticated: true,
      controller: asyncMiddleware(updateConfiguration),
    },
    'post /api/v1/service/zwave-js-ui/connect': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/zwave-js-ui/disconnect': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(disconnect),
    },
    'post /api/v1/service/zwave-js-ui/node/add': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(addNode),
    },
    'post /api/v1/service/zwave-js-ui/node/remove': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(removeNode),
    },
  };
};
