const { BadParameters } = require('../../utils/coreErrors');
const {
  EVENTS,
  WEBSOCKET_MESSAGE_TYPES,
  DEVICE_FEATURE_CATEGORIES_LIST,
  DEVICE_FEATURE_TYPES_LIST,
  DEVICE_FEATURE_UNITS_LIST,
  DEVICE_POLL_FREQUENCIES_LIST,
} = require('../../utils/constants');
const { MAX_DISCOVERED_DEVICES, RESERVED_PARAM_PREFIX, TRANSPORT_PARAM, DEVICE_TRANSPORTS } = require('./constants');

/**
 * @description Store the complete list of discovered devices published by an
 * integration (replaces the previous one). The list is kept in memory only
 * (like internal service handlers do), lost on restart and republished by the
 * integration on connection. The integration never creates devices itself:
 * the user creates them from the Discovery screen — but the params of the
 * devices ALREADY created are silently upserted on re-publish (they are the
 * technical data of the integration, see upsertDeviceParams).
 * @param {object} service - The external integration service.
 * @param {Array} devices - The complete list of discovered devices.
 * @returns {Promise<number>} Resolve with the number of discovered devices.
 * @example
 * await gladys.externalIntegration.setDiscoveredDevices(service, devices);
 */
async function setDiscoveredDevices(service, devices) {
  if (!Array.isArray(devices)) {
    throw new BadParameters('devices: must be an array');
  }
  if (devices.length > MAX_DISCOVERED_DEVICES) {
    throw new BadParameters(`devices: max ${MAX_DISCOVERED_DEVICES} devices`);
  }
  const externalIdPrefix = `ext:${service.selector}:`;
  const normalizedDevices = devices.map((device, index) => {
    if (device === null || typeof device !== 'object') {
      throw new BadParameters(`devices[${index}]: must be an object`);
    }
    if (typeof device.name !== 'string' || device.name.length === 0) {
      throw new BadParameters(`devices[${index}].name: must be a non-empty string`);
    }
    if (typeof device.external_id !== 'string' || !device.external_id.startsWith(externalIdPrefix)) {
      throw new BadParameters(`devices[${index}].external_id: must start with "${externalIdPrefix}"`);
    }
    if (device.poll_frequency !== undefined && !DEVICE_POLL_FREQUENCIES_LIST.includes(device.poll_frequency)) {
      throw new BadParameters(`devices[${index}].poll_frequency: invalid poll frequency`);
    }
    if (!Array.isArray(device.features)) {
      throw new BadParameters(`devices[${index}].features: must be an array`);
    }
    const features = device.features.map((feature, featureIndex) => {
      const featurePath = `devices[${index}].features[${featureIndex}]`;
      if (feature === null || typeof feature !== 'object') {
        throw new BadParameters(`${featurePath}: must be an object`);
      }
      if (typeof feature.external_id !== 'string' || !feature.external_id.startsWith(externalIdPrefix)) {
        throw new BadParameters(`${featurePath}.external_id: must start with "${externalIdPrefix}"`);
      }
      if (!DEVICE_FEATURE_CATEGORIES_LIST.includes(feature.category)) {
        throw new BadParameters(`${featurePath}.category: unknown category`);
      }
      if (!DEVICE_FEATURE_TYPES_LIST.includes(feature.type)) {
        throw new BadParameters(`${featurePath}.type: unknown type`);
      }
      if (feature.unit !== undefined && feature.unit !== null && !DEVICE_FEATURE_UNITS_LIST.includes(feature.unit)) {
        throw new BadParameters(`${featurePath}.unit: unknown unit`);
      }
      return { ...feature };
    });
    const params = Array.isArray(device.params) ? device.params : [];
    params.forEach((param, paramIndex) => {
      // the GLADYS_* params namespace is reserved to the semantics defined
      // by the spec; today: GLADYS_TRANSPORT, the effective transport of
      // the device (cloud/local badge in the UI)
      const paramName = param && typeof param.name === 'string' ? param.name : null;
      if (paramName === null || !paramName.toUpperCase().startsWith(RESERVED_PARAM_PREFIX)) {
        return;
      }
      const paramPath = `devices[${index}].params[${paramIndex}]`;
      if (paramName !== TRANSPORT_PARAM) {
        throw new BadParameters(`${paramPath}.name: ${RESERVED_PARAM_PREFIX}* names are reserved (${paramName})`);
      }
      if (!DEVICE_TRANSPORTS.includes(param.value)) {
        throw new BadParameters(`${paramPath}.value: must be one of ${DEVICE_TRANSPORTS.join(', ')}`);
      }
    });
    return {
      ...device,
      features,
      params,
      // service_id and selector are forced server side
      service_id: service.id,
    };
  });
  this.discoveredDevices.set(service.id, normalizedDevices);
  await Promise.all(
    normalizedDevices.map(async (device) => {
      const createdDevice = this.stateManager.get('deviceByExternalId', device.external_id);
      if (createdDevice && createdDevice.service_id === service.id) {
        await this.upsertDeviceParams(createdDevice, device.params);
      }
    }),
  );
  this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.DISCOVERED_DEVICES_UPDATED,
    payload: { selector: service.selector },
  });
  return normalizedDevices.length;
}

module.exports = {
  setDiscoveredDevices,
};
