const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');
const { DEVICE_PARAM_NAME } = require('../utils/tuya.constants');
const { DEVICE_FEATURE_UNITS } = require('../../../../utils/constants');
const { convertFeature } = require('./tuya.convertFeature');
const { getDeviceType, getIgnoredCloudCodes, getIgnoredLocalDps } = require('../mappings');
const logger = require('../../../../utils/logger');
const { slugify } = require('../../../../utils/slugify');

/**
 * @description Transform Tuya device to Gladys device.
 * @param {object} tuyaDevice - Tuya device.
 * @returns {object} Gladys device.
 * @example
 * tuya.convertDevice({ ... });
 */
function convertDevice(tuyaDevice) {
  const {
    name,
    product_name: productName,
    model,
    product_id: productId,
    product_key: productKey,
    id,
    local_key: localKey,
    ip,
    cloud_ip: cloudIp,
    protocol_version: protocolVersion,
    local_override: localOverride,
    properties,
    thing_model: thingModel,
    specifications = {},
    category,
  } = tuyaDevice;
  const externalId = `tuya:${id}`;
  const { functions = [], status = [] } = specifications;
  const online = tuyaDevice.online !== undefined ? tuyaDevice.online : tuyaDevice.is_online;

  const params = [];
  if (id) {
    params.push({ name: DEVICE_PARAM_NAME.DEVICE_ID, value: id });
  }
  if (localKey) {
    params.push({ name: DEVICE_PARAM_NAME.LOCAL_KEY, value: localKey });
  }
  if (ip) {
    params.push({ name: DEVICE_PARAM_NAME.IP_ADDRESS, value: ip });
  }
  if (cloudIp) {
    params.push({ name: DEVICE_PARAM_NAME.CLOUD_IP, value: cloudIp });
  }
  if (localOverride !== undefined && localOverride !== null) {
    params.push({ name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: localOverride });
  }
  if (protocolVersion) {
    params.push({ name: DEVICE_PARAM_NAME.PROTOCOL_VERSION, value: protocolVersion });
  }
  if (productId) {
    params.push({ name: DEVICE_PARAM_NAME.PRODUCT_ID, value: productId });
  }
  if (productKey) {
    params.push({ name: DEVICE_PARAM_NAME.PRODUCT_KEY, value: productKey });
  }
  const safeDeviceLog = {
    id,
    name,
    model: productName || model,
    product_id: productId,
    protocol_version: protocolVersion,
    local_override: localOverride,
    online,
  };
  logger.debug('Tuya convert device specifications');
  logger.debug(JSON.stringify(safeDeviceLog));

  logger.debug(`Tuya convert device "${name}, ${productName || model}"`);
  // Groups functions and status on same code
  const groups = {};
  status.forEach((stat) => {
    const { code } = stat;
    groups[code] = { ...stat, readOnly: true };
  });
  functions.forEach((func) => {
    const { code } = func;
    groups[code] = { ...func, readOnly: false };
  });

  const deviceType = getDeviceType({
    specifications,
    model,
    product_name: productName,
    name,
    category: specifications.category || category,
  });
  const ignoredLocalDps = getIgnoredLocalDps(deviceType);
  const ignoredCloudCodes = getIgnoredCloudCodes(deviceType);

  let temperatureUnit = null;
  if (properties && Array.isArray(properties.properties)) {
    const unitProperty = properties.properties.find(
      (property) => property.code === 'temp_unit_convert' || property.code === 'unit',
    );
    if (unitProperty && typeof unitProperty.value === 'string') {
      const normalized = unitProperty.value.trim().toLowerCase();
      if (['f', '℉', 'fahrenheit'].includes(normalized)) {
        temperatureUnit = DEVICE_FEATURE_UNITS.FAHRENHEIT;
      } else if (['c', '℃', 'celsius', 'centigrade', 'celcius'].includes(normalized)) {
        temperatureUnit = DEVICE_FEATURE_UNITS.CELSIUS;
      }
    }
  }
  if (temperatureUnit) {
    params.push({ name: DEVICE_PARAM_NAME.TEMPERATURE_UNIT, value: temperatureUnit });
  }

  const features = Object.values(groups).map((group) =>
    convertFeature(group, externalId, { deviceType, temperatureUnit }),
  );

  const specificationsPayload = {};
  if (specifications.category) {
    specificationsPayload.category = specifications.category;
  }
  if (functions.length > 0) {
    specificationsPayload.functions = functions;
  }
  if (status.length > 0) {
    specificationsPayload.status = status;
  }

  const device = {
    name,
    features: features.filter((feature) => feature),
    external_id: externalId,
    selector: slugify(externalId),
    model: productName || model,
    product_id: productId,
    product_key: productKey,
    service_id: this.serviceId,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS,
    should_poll: true,
    params,
    properties,
    specifications: specificationsPayload,
    tuya_mapping: {
      ignored_local_dps: ignoredLocalDps,
      ignored_cloud_codes: ignoredCloudCodes,
    },
    thing_model: thingModel,
  };
  if (online !== undefined) {
    device.online = online;
  }
  return device;
}

module.exports = {
  convertDevice,
};
