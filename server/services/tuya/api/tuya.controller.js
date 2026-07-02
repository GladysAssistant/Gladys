const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const logger = require('../../../utils/logger');
const { updateDiscoveredDeviceAfterLocalPoll } = require('../lib/tuya.localPoll');
const { buildLocalScanResponse } = require('../lib/tuya.localScan');
const { getAllDegraded, getLocalStatus, resetLocalStatus } = require('../lib/utils/tuya.degraded');

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
    // Manual user-triggered local poll resets the degraded backoff so the test
    // can attempt the local path even if the automatic poll has marked it.
    resetLocalStatus(tuyaManager.degradedDevices, payload.deviceId);
    const result = await tuyaManager.localPoll(payload);
    const updatedDevice = updateDiscoveredDeviceAfterLocalPoll(tuyaManager, {
      ...payload,
      dps: result.dps,
    });

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
   * @api {post} /api/v1/service/tuya/configuration Save Tuya configuration.
   * @apiName saveConfiguration
   * @apiGroup Tuya
   */
  async function saveConfiguration(req, res) {
    const configuration = await tuyaManager.saveConfiguration(req.body);
    res.json(configuration);
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

  /**
   * @api {get} /api/v1/service/tuya/local-status Get the current degraded-local backoff state for Tuya devices.
   * @apiName localStatus
   * @apiGroup Tuya
   */
  async function localStatus(req, res) {
    const { deviceId } = req.query || {};
    if (deviceId) {
      const entryStatus = getLocalStatus(tuyaManager.degradedDevices, deviceId);
      res.json({ deviceId, status: entryStatus });
      return;
    }
    res.json({ devices: getAllDegraded(tuyaManager.degradedDevices) });
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
    'post /api/v1/service/tuya/configuration': {
      authenticated: true,
      controller: asyncMiddleware(saveConfiguration),
    },
    'post /api/v1/service/tuya/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
    'get /api/v1/service/tuya/local-status': {
      authenticated: true,
      controller: asyncMiddleware(localStatus),
    },
  };
};
