const { DEVICE_FEATURE_TYPES, DISHWASHER_STATE } = require('../../../utils/constants');

/**
 * Matter Dishwasher device type identifier (Matter Device Library, 13.4 "Dishwasher").
 */
const MATTER_DISHWASHER_DEVICE_TYPE = 0x0075;

/**
 * Matter OperationalState cluster OperationalStateEnum values (Matter spec 1.15.5.1).
 * Manufacturer-specific states live in the 0x80-0xBF range and have no Gladys equivalent.
 */
const MATTER_OPERATIONAL_STATE = {
  STOPPED: 0,
  RUNNING: 1,
  PAUSED: 2,
  ERROR: 3,
};

/**
 * The six alarms of the Matter Dishwasher Alarm cluster AlarmBitmap (Matter spec 8.4.5.1),
 * each mapped to the Gladys device feature type publishing it.
 * `matterField` is the property name matter.js uses when it decodes the bitmap attribute.
 */
const DISHWASHER_ALARMS = [
  { matterField: 'inflowError', type: DEVICE_FEATURE_TYPES.DISHWASHER.INFLOW_ERROR, name: 'Inflow error' },
  { matterField: 'drainError', type: DEVICE_FEATURE_TYPES.DISHWASHER.DRAIN_ERROR, name: 'Drain error' },
  { matterField: 'doorError', type: DEVICE_FEATURE_TYPES.DISHWASHER.DOOR_ERROR, name: 'Door error' },
  {
    matterField: 'tempTooLow',
    type: DEVICE_FEATURE_TYPES.DISHWASHER.TEMPERATURE_TOO_LOW,
    name: 'Temperature too low',
  },
  {
    matterField: 'tempTooHigh',
    type: DEVICE_FEATURE_TYPES.DISHWASHER.TEMPERATURE_TOO_HIGH,
    name: 'Temperature too high',
  },
  {
    matterField: 'waterLevelError',
    type: DEVICE_FEATURE_TYPES.DISHWASHER.WATER_LEVEL_ERROR,
    name: 'Water level error',
  },
];

/**
 * @description Tell whether a Matter endpoint should be exposed as a dishwasher in Gladys.
 * The Operational State cluster is shared by every Matter appliance (laundry washer, oven...),
 * so it is only mapped to dishwasher features when the endpoint identifies itself as one:
 * either through the Matter Dishwasher device type, or through a dishwasher-specific cluster
 * (Dishwasher Alarm / Dishwasher Mode), which bridges expose even when they declare a
 * generic device type.
 * @param {object} device - The Matter endpoint.
 * @param {boolean} hasDishwasherSpecificCluster - True when the endpoint exposes a dishwasher-only cluster.
 * @returns {boolean} True when the endpoint is a dishwasher.
 * @example
 * const isDishwasher = isDishwasherEndpoint(device, false);
 */
function isDishwasherEndpoint(device, hasDishwasherSpecificCluster) {
  if (hasDishwasherSpecificCluster) {
    return true;
  }
  if (!device || typeof device.getDeviceTypes !== 'function') {
    return false;
  }
  const deviceTypes = device.getDeviceTypes();
  if (!Array.isArray(deviceTypes)) {
    return false;
  }
  return deviceTypes.some((deviceType) => deviceType && deviceType.code === MATTER_DISHWASHER_DEVICE_TYPE);
}

/**
 * @description Convert a Matter OperationalState value to a Gladys dishwasher state.
 * @param {number} matterState - The Matter OperationalState attribute value.
 * @returns {number} The Gladys DISHWASHER_STATE value, or the raw value when it is manufacturer-specific.
 * @example
 * const gladysState = convertMatterOperationalStateToDishwasherState(1); // DISHWASHER_STATE.RUNNING
 */
function convertMatterOperationalStateToDishwasherState(matterState) {
  switch (matterState) {
    case MATTER_OPERATIONAL_STATE.STOPPED:
      return DISHWASHER_STATE.STOPPED;
    case MATTER_OPERATIONAL_STATE.RUNNING:
      return DISHWASHER_STATE.RUNNING;
    case MATTER_OPERATIONAL_STATE.PAUSED:
      return DISHWASHER_STATE.PAUSED;
    case MATTER_OPERATIONAL_STATE.ERROR:
      return DISHWASHER_STATE.ERROR;
    default:
      return matterState;
  }
}

/**
 * @description List the dishwasher alarms an appliance supports.
 * The Dishwasher Alarm cluster declares them in its Supported bitmap: an appliance that does
 * not report an alarm must not get a feature stuck at zero. When the bitmap cannot be read,
 * every alarm of the cluster is exposed.
 * @param {object} [supported] - The Supported attribute of the Dishwasher Alarm cluster.
 * @returns {Array} The supported alarms, as entries of DISHWASHER_ALARMS.
 * @example
 * const alarms = getSupportedDishwasherAlarms({ inflowError: true });
 */
function getSupportedDishwasherAlarms(supported) {
  if (!supported || typeof supported !== 'object') {
    return DISHWASHER_ALARMS;
  }
  return DISHWASHER_ALARMS.filter((alarm) => supported[alarm.matterField] === true);
}

module.exports = {
  MATTER_DISHWASHER_DEVICE_TYPE,
  MATTER_OPERATIONAL_STATE,
  DISHWASHER_ALARMS,
  isDishwasherEndpoint,
  convertMatterOperationalStateToDishwasherState,
  getSupportedDishwasherAlarms,
};
