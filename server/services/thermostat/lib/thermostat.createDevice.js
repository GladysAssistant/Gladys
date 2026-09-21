const logger = require('../../../utils/logger');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  THERMOSTAT_MODE,
  THERMOSTAT_OPERATING_STATE,
  THERMOSTAT_PRESET,
} = require('../../../utils/constants');
const { THERMOSTAT_TYPES, DEFAULT_THERMOSTAT_TYPE } = require('../../../utils/thermostatConstants');

// Runtime state kept as params rather than features: a hold is bookkeeping of
// the regulation loop, not a property of the equipment. No form sends them, so
// they are carried over on save instead of being wiped.
const RUNTIME_PARAMS = ['THERMOSTAT_MANUAL_SETPOINT', 'THERMOSTAT_MANUAL_UNTIL'];

// Params the integration owns. Anything else sent by a client is dropped rather
// than persisted, so the device never carries unknown regulation settings.
const ALLOWED_PARAMS = [
  'THERMOSTAT_TEMPERATURE_FEATURE',
  'THERMOSTAT_HUMIDITY_FEATURE',
  'THERMOSTAT_SWITCH_FEATURE',
  'THERMOSTAT_TYPE',
  'THERMOSTAT_TARGET_FEATURE',
  'THERMOSTAT_STATE_FEATURE',
  'THERMOSTAT_MODE_FEATURE',
  'THERMOSTAT_WINDOW_FEATURE',
  'THERMOSTAT_MODE',
  'THERMOSTAT_CONTROL_TYPE',
  'THERMOSTAT_MIN_TEMP',
  'THERMOSTAT_MAX_TEMP',
  'THERMOSTAT_TEMP_UNIT',
  'THERMOSTAT_MANUAL_DURATION',
  // The manual hold. Not a setting the edit form offers, but a param all the
  // same: it has to survive a save, see RUNTIME_PARAMS below.
  'THERMOSTAT_MANUAL_SETPOINT',
  'THERMOSTAT_MANUAL_UNTIL',
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
 * @description Build the state features a thermostat carries besides its
 * setpoint: which temperature it aims for, what the machine does, and whether it
 * is currently heating. They are features rather than service variables because
 * they are state of the device: on a feature, a scene can read and write them,
 * and MQTT, HomeKit and Gladys Plus see them.
 * @param {object} device - The device being created, for its selector.
 * @param {boolean} external - Whether the real thermostat runs itself.
 * @returns {Array} The features to create alongside the setpoint.
 * @example
 * buildStateFeatures({ selector: 'living-room' }, false);
 */
function buildStateFeatures(device, external) {
  const base = device.selector || device.external_id;
  const preset = {
    name: 'Preset',
    external_id: `${base}:preset`,
    selector: `${base}:preset`,
    read_only: false,
    has_feedback: false,
    min: THERMOSTAT_PRESET.SCHEDULE,
    max: THERMOSTAT_PRESET.COMFORT,
    category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    type: DEVICE_FEATURE_TYPES.THERMOSTAT.PRESET,
  };
  const mode = {
    name: 'Mode',
    external_id: `${base}:mode`,
    selector: `${base}:mode`,
    read_only: false,
    has_feedback: false,
    min: THERMOSTAT_MODE.OFF,
    max: THERMOSTAT_MODE.COOLING,
    category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
    type: DEVICE_FEATURE_TYPES.THERMOSTAT.MODE,
  };
  if (external) {
    // The real device owns its setpoint and its running state, and mirroring
    // them here would give the house two of each, drifting apart.
    //
    // The preset and the mode are the exceptions, because they are Gladys's own
    // state rather than the appliance's. No thermostat publishes Gladys's preset
    // vocabulary; and "stopped by Gladys" is a decision this service takes — it
    // is what tells the regulation loop to leave the device alone, and a real
    // thermostat may not even expose a mode of its own (Netatmo does not).
    // Stopping the appliance is a separate act, done through
    // THERMOSTAT_MODE_FEATURE when it has one, plus the frost setpoint.
    return [preset, mode];
  }
  return [
    preset,
    mode,
    {
      // Written by the regulation loop, never by a client: a virtual thermostat
      // knows whether it is heating, and saying so on a standard feature makes it
      // visible to HomeKit rather than to this widget only.
      name: 'Operating state',
      external_id: `${base}:operating-state`,
      selector: `${base}:operating-state`,
      read_only: true,
      has_feedback: false,
      min: THERMOSTAT_OPERATING_STATE.IDLE,
      max: THERMOSTAT_OPERATING_STATE.COOLING,
      category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
      type: DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE,
    },
  ];
}

/**
 * @description Create a thermostat device linked to this service.
 * The payload is narrowed to what this integration owns: at most a single
 * thermostat/target-temperature feature and the known THERMOSTAT_* params.
 * Forwarding the request body as-is would let a client persist arbitrary
 * features and params on the device.
 *
 * A virtual thermostat carries its own setpoint feature: Gladys is the
 * thermostat, so the setpoint has to live somewhere. An external one carries
 * none — its setpoint is a feature of the real device, named by
 * THERMOSTAT_TARGET_FEATURE, and creating a second one here would give the
 * house two setpoints that drift apart.
 * @param {object} device - Device to create.
 * @returns {Promise<object>} Created device.
 * @example
 * await gladys.services.thermostat.device.createDevice({ name: 'Thermostat Salon', ... });
 */
async function createDevice(device) {
  logger.info(`Thermostat: Creating device "${device.name}"`);

  const params = (device.params || []).filter((param) => ALLOWED_PARAMS.includes(param.name));

  // `device.create` deletes every param the payload leaves out. The hold is
  // runtime state the edit form knows nothing about, so saving the form would
  // silently drop it — and the next regulation pass would overwrite the setpoint
  // the user, a scene or the physical dial had just chosen. Carry it over from
  // the device as it stands, unless the caller sent it explicitly.
  if (device.selector) {
    const devices = await this.gladys.device.get({ service: 'thermostat' });
    const existing = (devices || []).find((candidate) => candidate.selector === device.selector);
    const existingParams = (existing && existing.params) || [];
    RUNTIME_PARAMS.forEach((name) => {
      if (params.some((param) => param.name === name)) {
        return;
      }
      const carried = existingParams.find((param) => param.name === name);
      if (carried) {
        params.push({ name, value: carried.value });
      }
    });
  }

  const typeParam = params.find((param) => param.name === 'THERMOSTAT_TYPE');
  const thermostatType = (typeParam && typeParam.value) || DEFAULT_THERMOSTAT_TYPE;
  const external = thermostatType === THERMOSTAT_TYPES.EXTERNAL;

  const features = (device.features || []).filter(
    (feature) =>
      feature.category === DEVICE_FEATURE_CATEGORIES.THERMOSTAT &&
      feature.type === DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
  );

  if (external) {
    const targetParam = params.find((param) => param.name === 'THERMOSTAT_TARGET_FEATURE');
    if (!targetParam || !targetParam.value) {
      throw new Error('Thermostat: an external thermostat needs a THERMOSTAT_TARGET_FEATURE param');
    }
  } else if (features.length === 0) {
    throw new Error('Thermostat: a thermostat device needs a thermostat/target-temperature feature');
  }

  const createdDevice = await this.gladys.device.create({
    id: device.id,
    name: device.name,
    selector: device.selector,
    external_id: device.external_id,
    room_id: device.room_id,
    model: device.model,
    should_poll: false,
    // The state features are built here rather than taken from the payload: they
    // are not the client's to shape, and a device saved before they existed gets
    // them on its next save.
    features: [...(external ? [] : features.slice(0, 1)), ...buildStateFeatures(device, external)],
    params,
    service_id: this.serviceId,
  });
  // The window sensor and the feature set may have changed: drop the caches
  // derived from them so the next read rebuilds them.
  this.invalidateDeviceCaches();
  return createdDevice;
}

module.exports = { createDevice, buildStateFeatures, ALLOWED_PARAMS, RUNTIME_PARAMS };
