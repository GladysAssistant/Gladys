const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { DEVICE_PARAM_NAME } = require('../lib/utils/tuya.constants');

module.exports = function TuyaController(tuyaManager) {
  function upsertParam(params, name, value) {
    if (value === undefined || value === null) {
      return;
    }
    const index = params.findIndex((param) => param.name === name);
    if (index >= 0) {
      params[index] = { ...params[index], value };
    } else {
      params.push({ name, value });
    }
  }

  function updateDiscoveredDeviceWithLocalInfo(device, localInfo) {
    if (!device || !localInfo) {
      return device;
    }
    const updated = { ...device };
    updated.protocol_version = localInfo.version;
    updated.ip = localInfo.ip || updated.ip;
    updated.product_key = localInfo.productKey;
    updated.local_override = true;
    updated.params = Array.isArray(updated.params) ? [...updated.params] : [];
    upsertParam(updated.params, DEVICE_PARAM_NAME.IP_ADDRESS, updated.ip);
    upsertParam(updated.params, DEVICE_PARAM_NAME.PROTOCOL_VERSION, updated.protocol_version);
    upsertParam(updated.params, DEVICE_PARAM_NAME.PRODUCT_KEY, updated.product_key);
    upsertParam(updated.params, DEVICE_PARAM_NAME.LOCAL_OVERRIDE, true);
    return updated;
  }
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
    const result = await tuyaManager.localPoll(req.body);
    const { deviceId, ip, protocolVersion, localKey } = req.body || {};

    let updatedDevice = null;
    if (deviceId && Array.isArray(tuyaManager.discoveredDevices)) {
      const externalId = `tuya:${deviceId}`;
      const deviceIndex = tuyaManager.discoveredDevices.findIndex((device) => device.external_id === externalId);
      if (deviceIndex >= 0) {
        const device = { ...tuyaManager.discoveredDevices[deviceIndex] };
        device.protocol_version = protocolVersion;
        device.ip = ip;
        device.local_override = true;
        if (localKey) {
          device.local_key = localKey;
        }
        device.params = Array.isArray(device.params) ? [...device.params] : [];
        upsertParam(device.params, DEVICE_PARAM_NAME.IP_ADDRESS, ip);
        upsertParam(device.params, DEVICE_PARAM_NAME.PROTOCOL_VERSION, protocolVersion);
        upsertParam(device.params, DEVICE_PARAM_NAME.LOCAL_KEY, localKey);
        upsertParam(device.params, DEVICE_PARAM_NAME.LOCAL_OVERRIDE, true);
        upsertParam(device.params, DEVICE_PARAM_NAME.DP_MAP, JSON.stringify(result));
        upsertParam(device.params, DEVICE_PARAM_NAME.PRODUCT_ID, device.product_id);
        upsertParam(device.params, DEVICE_PARAM_NAME.PRODUCT_KEY, device.product_key);

        tuyaManager.discoveredDevices[deviceIndex] = device;
        updatedDevice = device;
      }
    }

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
    const localDevicesById = await tuyaManager.localScan(timeoutSeconds);

    if (Array.isArray(tuyaManager.discoveredDevices)) {
      const updatedDevices = tuyaManager.discoveredDevices.map((device) => {
        const deviceId = device.external_id && device.external_id.split(':')[1];
        const localInfo = localDevicesById[deviceId];
        if (!localInfo) {
          return device;
        }
        return updateDiscoveredDeviceWithLocalInfo(device, localInfo);
      });
      tuyaManager.discoveredDevices = updatedDevices;
      res.json({
        devices: updatedDevices,
        local_devices: localDevicesById,
      });
      return;
    }

    res.json({
      local_devices: localDevicesById,
    });
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
  };
};
