const { DEVICE_POLL_FREQUENCIES } = require('../../../../utils/constants');
const { DEVICE_PARAM_NAME } = require('../utils/tuya.constants');
const { normalizeBoolean } = require('../utils/tuya.normalize');
const { resolveCloudReadStrategy } = require('../utils/tuya.cloudStrategy');
const { mergeTuyaReport } = require('../utils/tuya.report');
const { convertFeature } = require('./tuya.convertFeature');
const { getDeviceType, getIgnoredCloudCodes, getIgnoredLocalDps, DEVICE_TYPES } = require('../mappings');
const logger = require('../../../../utils/logger');

const parseFeatureValues = (values) => {
  if (!values || typeof values !== 'object') {
    if (typeof values === 'string') {
      try {
        const parsed = JSON.parse(values);
        return parsed && typeof parsed === 'object' ? parsed : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  }
  return values;
};

const mergeFeatureValues = (currentValues, nextValues) => {
  const currentParsed = parseFeatureValues(currentValues);
  const nextParsed = parseFeatureValues(nextValues);

  if (currentParsed && nextParsed) {
    // Keep existing keys first, enrich missing metadata from the new source.
    return {
      ...nextParsed,
      ...currentParsed,
    };
  }
  if (currentParsed) {
    return currentParsed;
  }
  if (nextParsed) {
    return nextParsed;
  }
  if (currentValues !== undefined && currentValues !== null) {
    return currentValues;
  }
  if (nextValues !== undefined && nextValues !== null) {
    return nextValues;
  }
  return {};
};

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
    status: deviceStatus,
    category,
    tuya_report: tuyaReport,
  } = tuyaDevice;
  const externalId = `tuya:${id}`;
  const { functions = [], status = [] } = specifications;
  const online = tuyaDevice.online !== undefined ? tuyaDevice.online : tuyaDevice.is_online;
  const normalizedLocalOverride = normalizeBoolean(localOverride);

  logger.debug(`Tuya convert device "${name}, ${productName || model}"`);
  const deviceType = getDeviceType({
    specifications,
    status: deviceStatus,
    model,
    product_name: productName,
    product_id: productId,
    name,
    category: specifications.category || category,
    properties,
    thing_model: thingModel,
  });
  const cloudReadStrategy = resolveCloudReadStrategy(tuyaDevice, deviceType);

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
    params.push({ name: DEVICE_PARAM_NAME.LOCAL_OVERRIDE, value: normalizedLocalOverride });
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
  if (cloudReadStrategy) {
    params.push({ name: DEVICE_PARAM_NAME.CLOUD_READ_STRATEGY, value: cloudReadStrategy });
  }
  const safeDeviceLog = {
    id,
    name,
    model: productName || model,
    product_id: productId,
    protocol_version: protocolVersion,
    local_override: normalizedLocalOverride,
    online,
  };
  logger.debug('Tuya convert device specifications');
  logger.debug(JSON.stringify(safeDeviceLog));

  // Build features from specifications first, enrich metadata from thing model, then fallback to status/properties.
  const groups = {};
  status.forEach((stat) => {
    const { code } = stat || {};
    if (!code) {
      return;
    }
    const existingGroup = groups[code] || {};
    groups[code] = {
      ...existingGroup,
      ...stat,
      values: mergeFeatureValues(existingGroup.values, stat && stat.values),
      readOnly: true,
    };
  });
  functions.forEach((func) => {
    const { code } = func || {};
    if (!code) {
      return;
    }
    const existingGroup = groups[code] || {};
    groups[code] = {
      ...existingGroup,
      ...func,
      values: mergeFeatureValues(existingGroup.values, func && func.values),
      readOnly: false,
    };
  });
  const services = Array.isArray(thingModel && thingModel.services) ? thingModel.services : [];
  services.forEach((service) => {
    const thingProperties = Array.isArray(service && service.properties) ? service.properties : [];
    thingProperties.forEach((property) => {
      const { code } = property || {};
      if (!code) {
        return;
      }
      const existingGroup = groups[code] || {};
      groups[code] = {
        ...existingGroup,
        code,
        name: existingGroup.name || property.name,
        values: mergeFeatureValues(existingGroup.values, property.typeSpec || {}),
        readOnly:
          existingGroup.readOnly !== undefined && existingGroup.readOnly !== null
            ? existingGroup.readOnly
            : property.accessMode !== 'rw',
      };
    });
  });
  const topLevelStatus = Array.isArray(deviceStatus) ? deviceStatus : [];
  topLevelStatus.forEach((entry) => {
    const { code } = entry || {};
    if (!code || groups[code]) {
      return;
    }
    groups[code] = {
      code,
      name: code,
      values: {},
      readOnly: true,
    };
  });
  const currentProperties = Array.isArray(properties && properties.properties) ? properties.properties : [];
  currentProperties.forEach((property) => {
    const { code } = property || {};
    if (!code || groups[code]) {
      return;
    }
    groups[code] = {
      code,
      name: property.custom_name || property.name || code,
      values: {},
      readOnly: true,
    };
  });

  const ignoredCloudCodes = getIgnoredCloudCodes(deviceType);
  const ignoredLocalDps = getIgnoredLocalDps(deviceType);
  const features = Object.values(groups).map((group) =>
    convertFeature(group, externalId, {
      deviceType,
      ignoredCloudCodes,
    }),
  );
  const filteredFeatures = features.filter((feature) => feature);
  if (filteredFeatures.length === 0 && deviceType !== DEVICE_TYPES.UNKNOWN) {
    logger.debug(
      `[Tuya][convertDevice] inferred type=${deviceType} but no supported feature found (device=${id ||
        'unknown'} product_id=${productId || 'unknown'} spec_functions=${functions.length} spec_status=${
        status.length
      } list_status=${topLevelStatus.length} shadow_properties=${currentProperties.length} thing_services=${
        services.length
      })`,
    );
  }

  const device = {
    name,
    features: filteredFeatures,
    device_type: deviceType,
    external_id: externalId,
    selector: externalId,
    model: productName || model,
    product_id: productId,
    product_key: productKey,
    service_id: this.serviceId,
    poll_frequency: normalizedLocalOverride
      ? DEVICE_POLL_FREQUENCIES.EVERY_10_SECONDS
      : DEVICE_POLL_FREQUENCIES.EVERY_30_SECONDS,
    should_poll: true,
    params,
    properties,
    specifications,
    tuya_mapping: {
      ignored_local_dps: ignoredLocalDps,
      ignored_cloud_codes: ignoredCloudCodes,
    },
    thing_model: thingModel,
  };
  if (online !== undefined) {
    device.online = online;
  }
  if (tuyaReport) {
    device.tuya_report = mergeTuyaReport(null, tuyaReport);
  }
  return device;
}

module.exports = {
  convertDevice,
};
