const logger = require('../../../utils/logger');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

// Params the integration owns. Anything else sent by a client is dropped rather
// than persisted, so the device never carries unknown regulation settings.
const ALLOWED_PARAMS = [
  'THERMOSTAT_TEMPERATURE_FEATURE',
  'THERMOSTAT_HUMIDITY_FEATURE',
  'THERMOSTAT_SWITCH_FEATURE',
  'THERMOSTAT_WINDOW_FEATURE',
  'THERMOSTAT_ACTIVE_SCHEDULE',
  'THERMOSTAT_MODE',
  'THERMOSTAT_CONTROL_TYPE',
  'THERMOSTAT_MIN_TEMP',
  'THERMOSTAT_MAX_TEMP',
  'THERMOSTAT_TEMP_UNIT',
  'THERMOSTAT_MANUAL_DURATION',
  'THERMOSTAT_PRESET_FROST',
  'THERMOSTAT_PRESET_AWAY',
  'THERMOSTAT_PRESET_ECO',
  'THERMOSTAT_PRESET_NIGHT',
  'THERMOSTAT_PRESET_COMFORT',
  'THERMOSTAT_HYSTERESIS_START',
  'THERMOSTAT_HYSTERESIS_STOP',
  'THERMOSTAT_TPI_CYCLE_TIME',
  'THERMOSTAT_TPI_PROPORTIONAL_BAND',
];

/**
 * @description Create a thermostat device linked to this service.
 * The payload is narrowed to what this integration owns: a single
 * thermostat/target-temperature feature and the known THERMOSTAT_* params.
 * Forwarding the request body as-is would let a client persist arbitrary
 * features and params on the device.
 * @param {object} device - Device to create.
 * @returns {Promise<object>} Created device.
 * @example
 * await gladys.services.thermostat.device.createDevice({ name: 'Thermostat Salon', ... });
 */
async function createDevice(device) {
  logger.info(`Thermostat: Creating device "${device.name}"`);

  const features = (device.features || []).filter(
    (feature) =>
      feature.category === DEVICE_FEATURE_CATEGORIES.THERMOSTAT &&
      feature.type === DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
  );
  if (features.length === 0) {
    throw new Error('Thermostat: a thermostat device needs a thermostat/target-temperature feature');
  }

  const params = (device.params || []).filter((param) => ALLOWED_PARAMS.includes(param.name));

  const createdDevice = await this.gladys.device.create({
    id: device.id,
    name: device.name,
    selector: device.selector,
    external_id: device.external_id,
    room_id: device.room_id,
    model: device.model,
    should_poll: false,
    features: features.slice(0, 1),
    params,
    service_id: this.serviceId,
  });
  // The window sensor may have changed: drop the cached selectors so the next
  // NEW_STATE event rebuilds them.
  this.invalidateWindowCache();
  return createdDevice;
}

module.exports = { createDevice, ALLOWED_PARAMS };
