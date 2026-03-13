import { normalizeBoolean, getLocalOverrideValue, getTuyaDeviceId } from './deviceHelpers';

const TRY_PROTOCOLS = ['3.5', '3.4', '3.3', '3.1'];

const isValidIpAddress = ip =>
  typeof ip === 'string' && /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(ip);

const getParamValue = (params, name) => {
  const found = params.find(param => param.name === name);
  return found ? found.value : undefined;
};

const upsertParam = (params, name, value) => {
  if (value === undefined || value === null || value === '') {
    return;
  }
  const index = params.findIndex(param => param.name === name);
  if (index >= 0) {
    params[index] = { ...params[index], value };
  } else {
    params.push({ name, value });
  }
};

export const pollLocalDevice = async ({ httpClient, device, onProtocolAttempt }) => {
  const currentDevice = device;
  const params = Array.isArray(currentDevice && currentDevice.params) ? [...currentDevice.params] : [];
  const selectedProtocol = getParamValue(params, 'PROTOCOL_VERSION') || currentDevice.protocol_version;
  const deviceId = getTuyaDeviceId(currentDevice) || undefined;
  const localKey = getParamValue(params, 'LOCAL_KEY') || currentDevice.local_key;
  const localOverride = normalizeBoolean(getLocalOverrideValue(currentDevice));
  let resolvedIp = getParamValue(params, 'IP_ADDRESS') || currentDevice.ip;
  let scannedProtocolVersion = null;
  let scannedDevice = null;

  if (localOverride === true && localKey && deviceId && !isValidIpAddress(resolvedIp)) {
    const localScanResponse = await httpClient.post('/api/v1/service/tuya/local-scan', {
      timeoutSeconds: 5
    });
    const localDevices =
      localScanResponse && localScanResponse.local_devices && typeof localScanResponse.local_devices === 'object'
        ? localScanResponse.local_devices
        : {};
    const localInfo = localDevices[deviceId];
    if (!localInfo || !localInfo.ip) {
      throw new Error('Local auto scan did not find this device IP');
    }
    resolvedIp = localInfo.ip;
    scannedProtocolVersion = localInfo.version || null;
    upsertParam(params, 'IP_ADDRESS', resolvedIp);
    if (scannedProtocolVersion) {
      upsertParam(params, 'PROTOCOL_VERSION', scannedProtocolVersion);
    }
    if (Array.isArray(localScanResponse && localScanResponse.devices)) {
      scannedDevice =
        localScanResponse.devices.find(localDevice => localDevice.external_id === `tuya:${deviceId}`) ||
        localScanResponse.devices.find(localDevice => localDevice.external_id === currentDevice.external_id) ||
        null;
    }
  }

  const protocolList = selectedProtocol
    ? [selectedProtocol]
    : scannedProtocolVersion
    ? [scannedProtocolVersion, ...TRY_PROTOCOLS.filter(protocol => protocol !== scannedProtocolVersion)]
    : TRY_PROTOCOLS;

  let result = null;
  let usedProtocol = selectedProtocol;
  let latestDevice = null;
  const isValidResult = data => data && typeof data === 'object' && data.dps;

  for (let i = 0; i < protocolList.length; i += 1) {
    const protocolVersion = protocolList[i];
    try {
      if (typeof onProtocolAttempt === 'function') {
        onProtocolAttempt(protocolVersion);
      }
      const response = await httpClient.post('/api/v1/service/tuya/local-poll', {
        deviceId,
        ip: resolvedIp,
        localKey,
        protocolVersion,
        timeoutMs: 3000,
        fastScan: true
      });
      result = response && response.dps ? response : null;
      const updatedDevice = response && response.device ? response.device : null;
      if (updatedDevice) {
        latestDevice = updatedDevice;
      }
      if (!isValidResult(result)) {
        throw new Error('Invalid local poll response');
      }
      usedProtocol = protocolVersion;
      break;
    } catch (e) {
      if (i === protocolList.length - 1) {
        throw e;
      }
    }
  }

  const baseDevice = latestDevice || scannedDevice || currentDevice;
  const newParams = Array.isArray(baseDevice && baseDevice.params) ? [...baseDevice.params] : [];
  if (resolvedIp) {
    upsertParam(newParams, 'IP_ADDRESS', resolvedIp);
  }
  if (usedProtocol) {
    upsertParam(newParams, 'PROTOCOL_VERSION', usedProtocol);
  }

  return {
    device: {
      ...baseDevice,
      params: newParams
    },
    dps: result ? result.dps : null,
    protocol: usedProtocol || '',
    ip: resolvedIp || ''
  };
};
