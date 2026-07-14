const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function IntegrationHostController(gladys) {
  /**
   * @api {get} /api/integration/v1/status getStatus
   * @apiName getStatus
   * @apiGroup IntegrationHostApi
   * @apiDescription The identity comes from the integration JWT (`/me`
   * pattern): no integration selector in the URLs, each integration only
   * sees its own perimeter.
   * @apiSuccessExample {json} Success-Example
   * {
   *   "gladys_version": "v4.82.0",
   *   "service": { "id": "uuid", "selector": "ext-open-meteo-demo", "status": "RUNNING", "version": "1.2.0" }
   * }
   */
  async function getStatus(req, res) {
    const service = req.externalIntegrationService;
    res.json({
      gladys_version: gladys.system.gladysVersion || null,
      service: {
        id: service.id,
        selector: service.selector,
        status: service.status,
        version: service.version,
      },
    });
  }

  /**
   * @api {post} /api/integration/v1/heartbeat heartbeat
   * @apiName heartbeat
   * @apiGroup IntegrationHostApi
   * @apiDescription HTTP fallback of the WebSocket heartbeat.
   */
  async function heartbeat(req, res) {
    await gladys.externalIntegration.handleHeartbeat(req.externalIntegrationService);
    res.json({ success: true });
  }

  /**
   * @api {post} /api/integration/v1/discovered_device publishDiscoveredDevices
   * @apiName publishDiscoveredDevices
   * @apiGroup IntegrationHostApi
   * @apiDescription Publish the complete list of discovered devices
   * (replaces the previous one). The integration never creates devices:
   * creation stays a user gesture in the UI.
   */
  async function publishDiscoveredDevices(req, res) {
    const count = gladys.externalIntegration.setDiscoveredDevices(req.externalIntegrationService, req.body.devices);
    res.json({ success: true, count });
  }

  /**
   * @api {get} /api/integration/v1/device getDevices
   * @apiName getDevices
   * @apiGroup IntegrationHostApi
   * @apiDescription Read only: the devices of the integration really
   * created by the user.
   */
  async function getDevices(req, res) {
    const devices = await gladys.externalIntegration.getDevices(req.externalIntegrationService);
    res.json(devices);
  }

  /**
   * @api {post} /api/integration/v1/state publishStates
   * @apiName publishStates
   * @apiGroup IntegrationHostApi
   * @apiDescription Batch of states, mapped on the native services path
   * (device.new-state events). Rate limited to 300 states/minute.
   */
  async function publishStates(req, res) {
    gladys.externalIntegration.saveStates(req.externalIntegrationService, req.body.states);
    res.json({ success: true });
  }

  /**
   * @api {get} /api/integration/v1/config getConfig
   * @apiName getConfig
   * @apiGroup IntegrationHostApi
   * @apiDescription All the config values, secrets included (this is the
   * integration, not the frontend).
   */
  async function getConfig(req, res) {
    const config = await gladys.externalIntegration.getIntegrationConfig(req.externalIntegrationService);
    res.json({ config });
  }

  /**
   * @api {post} /api/integration/v1/config saveConfig
   * @apiName saveConfig
   * @apiGroup IntegrationHostApi
   * @apiDescription Partial merge. Keys in the config_schema are validated
   * against it; keys outside the schema are a free internal storage of the
   * integration. Never echoed back as config-updated.
   */
  async function saveConfig(req, res) {
    await gladys.externalIntegration.setIntegrationConfig(req.externalIntegrationService, req.body.config);
    res.json({ success: true });
  }

  return Object.freeze({
    getStatus: asyncMiddleware(getStatus),
    heartbeat: asyncMiddleware(heartbeat),
    publishDiscoveredDevices: asyncMiddleware(publishDiscoveredDevices),
    getDevices: asyncMiddleware(getDevices),
    publishStates: asyncMiddleware(publishStates),
    getConfig: asyncMiddleware(getConfig),
    saveConfig: asyncMiddleware(saveConfig),
  });
};
