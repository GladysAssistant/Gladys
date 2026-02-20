const { DEVICE_PARAM_NAME } = require('./tuya.constants');
const { normalizeBoolean } = require('./tuya.normalize');

const upsertParam = (params, name, value) => {
  if (value === undefined || value === null) {
    return;
  }
  const index = params.findIndex((param) => param.name === name);
  if (index >= 0) {
    params[index] = { ...params[index], value };
  } else {
    params.push({ name, value });
  }
};

const normalizeExistingDevice = (device) => {
  if (!device || !Array.isArray(device.params)) {
    return device;
  }
  const normalizedParams = device.params.map((param) =>
    param.name === DEVICE_PARAM_NAME.LOCAL_OVERRIDE ? { ...param, value: normalizeBoolean(param.value) } : param,
  );
  return { ...device, params: normalizedParams };
};

const updateDiscoveredDeviceWithLocalInfo = (device, localInfo) => {
  if (!device || !localInfo) {
    return device;
  }
  const updated = { ...device };
  updated.protocol_version = localInfo.version;
  updated.ip = localInfo.ip || updated.ip;
  updated.product_key = localInfo.productKey;
  updated.params = Array.isArray(updated.params) ? [...updated.params] : [];
  upsertParam(updated.params, DEVICE_PARAM_NAME.IP_ADDRESS, updated.ip);
  upsertParam(updated.params, DEVICE_PARAM_NAME.PROTOCOL_VERSION, updated.protocol_version);
  upsertParam(updated.params, DEVICE_PARAM_NAME.PRODUCT_KEY, updated.product_key);
  return updated;
};

const getExistingParamValue = (existingDevice, name) => {
  if (!existingDevice || !Array.isArray(existingDevice.params)) {
    return undefined;
  }
  const param = existingDevice.params.find((item) => item.name === name);
  return param ? param.value : undefined;
};

const applyExistingLocalParams = (device, existingDevice) => {
  if (!existingDevice) {
    return device;
  }
  const params = Array.isArray(device.params) ? [...device.params] : [];
  const ipValue = getExistingParamValue(existingDevice, DEVICE_PARAM_NAME.IP_ADDRESS);
  const protocolValue = getExistingParamValue(existingDevice, DEVICE_PARAM_NAME.PROTOCOL_VERSION);
  const localOverrideValue = getExistingParamValue(existingDevice, DEVICE_PARAM_NAME.LOCAL_OVERRIDE);

  upsertParam(params, DEVICE_PARAM_NAME.IP_ADDRESS, ipValue);
  upsertParam(params, DEVICE_PARAM_NAME.PROTOCOL_VERSION, protocolValue);
  upsertParam(params, DEVICE_PARAM_NAME.LOCAL_OVERRIDE, localOverrideValue);

  return {
    ...device,
    params,
    ip: ipValue !== undefined && ipValue !== null ? ipValue : device.ip,
    protocol_version: protocolValue !== undefined && protocolValue !== null ? protocolValue : device.protocol_version,
    local_override:
      localOverrideValue !== undefined && localOverrideValue !== null ? localOverrideValue : device.local_override,
  };
};

const applyExistingLocalOverride = (device, existingDevice) => {
  if (!existingDevice || !Array.isArray(existingDevice.params)) {
    return device;
  }
  const overrideParam = existingDevice.params.find((param) => param.name === DEVICE_PARAM_NAME.LOCAL_OVERRIDE);
  if (!overrideParam) {
    return device;
  }
  const updated = { ...device };
  updated.params = Array.isArray(updated.params) ? [...updated.params] : [];
  upsertParam(updated.params, DEVICE_PARAM_NAME.LOCAL_OVERRIDE, overrideParam.value);
  updated.local_override = overrideParam.value;
  return updated;
};

module.exports = {
  applyExistingLocalOverride,
  applyExistingLocalParams,
  normalizeExistingDevice,
  updateDiscoveredDeviceWithLocalInfo,
  upsertParam,
};
