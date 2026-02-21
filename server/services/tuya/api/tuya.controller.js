const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const logger = require('../../../utils/logger');
const { updateDiscoveredDeviceAfterLocalPoll } = require('../lib/tuya.localPoll');
const { buildLocalScanResponse } = require('../lib/tuya.localScan');

module.exports = function TuyaController(tuyaManager) {
  /**
   * @api {get} /api/v1/service/tuya/discover Retrieve tuya devices from cloud.
   * @apiName discover
   * @apiGroup Tuya
   */
  async function discover(req, res) {
    const devices = await tuyaManager.discoverDevices();
    res.json(devices);
  }

  /**
   * @api {post} /api/v1/service/tuya/local-poll Poll one Tuya device locally to retrieve DPS.
   * @apiName localPoll
   * @apiGroup Tuya
   */
  async function localPoll(req, res) {
    const payload = req.body || {};
    const result = await tuyaManager.localPoll(payload);
    const updatedDevice = updateDiscoveredDeviceAfterLocalPoll(tuyaManager, payload);

    if (updatedDevice) {
      res.json({
        ...result,
        device: updatedDevice,
      });
      return;
    }

    res.json(result);
  }

  /**
   * @api {post} /api/v1/service/tuya/local-scan Manual UDP scan for local Tuya devices.
   * @apiName localScan
   * @apiGroup Tuya
   */
  async function localScan(req, res) {
    const { timeoutSeconds } = req.body || {};
    logger.info(`[Tuya][localScan] API request received (timeoutSeconds=${timeoutSeconds || 10})`);
    const localScanResult = await tuyaManager.localScan({
      timeoutSeconds,
    });
    res.json(buildLocalScanResponse(tuyaManager, localScanResult));
  }

  /**
   * @api {get} /api/v1/service/tuya/status Get Tuya connection status.
   * @apiName status
   * @apiGroup Tuya
   */
  async function status(req, res) {
    const response = await tuyaManager.getStatus();
    res.json(response);
  }

  /**
   * @api {post} /api/v1/service/tuya/disconnect Disconnect Tuya cloud.
   * @apiName disconnect
   * @apiGroup Tuya
   */
  async function disconnect(req, res) {
    await tuyaManager.manualDisconnect();
    res.json({ success: true });
  }

  return {
    'get /api/v1/service/tuya/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
    'post /api/v1/service/tuya/local-poll': {
      authenticated: true,
      controller: asyncMiddleware(localPoll),
    },
    'post /api/v1/service/tuya/local-scan': {
      authenticated: true,
      controller: asyncMiddleware(localScan),
    },
    'get /api/v1/service/tuya/status': {
      authenticated: true,
      controller: asyncMiddleware(status),
    },
    'post /api/v1/service/tuya/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
  };
};
