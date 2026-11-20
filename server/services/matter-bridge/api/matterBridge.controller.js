const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function MatterBridgeController(bridge) {
  /**
   * @api {get} /api/v1/service/matter-bridge/status Get the Matter bridge status
   * @apiName getStatus
   * @apiGroup MatterBridge
   */
  async function getStatus(req, res) {
    res.json(await bridge.getStatus());
  }

  /**
   * @api {get} /api/v1/service/matter-bridge/device Get the devices the Matter bridge can expose
   * @apiName getDevices
   * @apiGroup MatterBridge
   */
  async function getDevices(req, res) {
    res.json(await bridge.getCompatibleDevices());
  }

  /**
   * @api {post} /api/v1/service/matter-bridge/enable Turn the Matter bridge on
   * @apiName enable
   * @apiGroup MatterBridge
   */
  async function enable(req, res) {
    res.json(await bridge.setEnabled(true));
  }

  /**
   * @api {post} /api/v1/service/matter-bridge/disable Turn the Matter bridge off
   * @apiName disable
   * @apiGroup MatterBridge
   */
  async function disable(req, res) {
    res.json(await bridge.setEnabled(false));
  }

  /**
   * @api {post} /api/v1/service/matter-bridge/config Save and apply the devices the Matter bridge exposes
   * @apiName saveConfig
   * @apiGroup MatterBridge
   * @apiBody {string} exposureMode "all" or "selection"
   * @apiBody {string[]} exposedDevices Selectors of the selected devices
   */
  async function saveConfig(req, res) {
    res.json(await bridge.saveConfig(req.body));
  }

  /**
   * @api {post} /api/v1/service/matter-bridge/reset Forget every pairing of the Matter bridge
   * @apiName reset
   * @apiGroup MatterBridge
   */
  async function reset(req, res) {
    await bridge.reset();
    res.json(await bridge.getStatus());
  }

  return {
    'get /api/v1/service/matter-bridge/status': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(getStatus),
    },
    'get /api/v1/service/matter-bridge/device': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(getDevices),
    },
    'post /api/v1/service/matter-bridge/enable': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(enable),
    },
    'post /api/v1/service/matter-bridge/disable': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(disable),
    },
    'post /api/v1/service/matter-bridge/config': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(saveConfig),
    },
    'post /api/v1/service/matter-bridge/reset': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(reset),
    },
  };
};
