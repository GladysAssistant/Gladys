const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  AC_MODE,
} = require('../../../../utils/constants');
const { ATA_OPERATION_MODE } = require('../utils/melcloud-home.constants');

/**
 * @description Read a value from the MELCloud Home unit `settings` array.
 * @param {object} unit - MELCloud Home air-to-air unit.
 * @param {string} name - Setting name (e.g. 'Power', 'SetTemperature').
 * @returns {string|undefined} The setting value (a string) or undefined.
 * @example
 * getSetting(unit, 'Power');
 */
function getSetting(unit, name) {
  const setting = (unit.settings || []).find((currentSetting) => currentSetting.name === name);
  return setting ? setting.value : undefined;
}

/**
 * @description Parse a MELCloud Home string value into a number.
 * @param {string|undefined} value - The raw string value.
 * @returns {number|null} The parsed number, or null if not parseable.
 * @example
 * toNumber('28');
 */
function toNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * @description Compute the target temperature bounds from the unit capabilities.
 * @param {object} unit - MELCloud Home air-to-air unit.
 * @returns {object} Temperature bounds as an object with min and max.
 * @example
 * getTemperatureBounds(unit);
 */
function getTemperatureBounds(unit) {
  const capabilities = unit.capabilities || {};
  const mins = [capabilities.minTempHeat, capabilities.minTempCoolDry, capabilities.minTempAutomatic].filter(
    (value) => typeof value === 'number',
  );
  const maxs = [capabilities.maxTempHeat, capabilities.maxTempCoolDry, capabilities.maxTempAutomatic].filter(
    (value) => typeof value === 'number',
  );
  return {
    min: mins.length > 0 ? Math.min(...mins) : 10,
    max: maxs.length > 0 ? Math.max(...maxs) : 31,
  };
}

/**
 * @description Get Gladys device features from a MELCloud Home air-to-air unit.
 * @param {string} externalId - External ID of the Gladys device.
 * @param {object} unit - MELCloud Home air-to-air unit.
 * @returns {Array} Array of Gladys device features.
 * @example
 * getGladysDeviceFeatures('melcloud-home:123456789', unit);
 */
function getGladysDeviceFeatures(externalId, unit) {
  const { min, max } = getTemperatureBounds(unit);
  return [
    {
      name: 'Power',
      external_id: `${externalId}:power`,
      selector: `${externalId}:power`,
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 1,
      category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
      type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY,
    },
    {
      name: 'Mode',
      external_id: `${externalId}:mode`,
      selector: `${externalId}:mode`,
      read_only: false,
      has_feedback: true,
      min: 0,
      max: 1,
      category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
      type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE,
    },
    {
      name: 'Temperature',
      external_id: `${externalId}:temperature`,
      selector: `${externalId}:temperature`,
      read_only: false,
      has_feedback: true,
      min,
      max,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
      category: DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
      type: DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE,
    },
    {
      name: 'Room temperature',
      external_id: `${externalId}:room-temperature`,
      selector: `${externalId}:room-temperature`,
      read_only: true,
      keep_history: true,
      has_feedback: false,
      min: -10,
      max: 50,
      unit: DEVICE_FEATURE_UNITS.CELSIUS,
      category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
    },
  ];
}

const modesMELCloudToGladys = {
  [ATA_OPERATION_MODE.HEAT]: AC_MODE.HEATING,
  [ATA_OPERATION_MODE.DRY]: AC_MODE.DRYING,
  [ATA_OPERATION_MODE.COOL]: AC_MODE.COOLING,
  [ATA_OPERATION_MODE.FAN]: AC_MODE.FAN,
  [ATA_OPERATION_MODE.AUTOMATIC]: AC_MODE.AUTO,
};

const modesGladysToMELCloud = {
  [AC_MODE.HEATING]: ATA_OPERATION_MODE.HEAT,
  [AC_MODE.DRYING]: ATA_OPERATION_MODE.DRY,
  [AC_MODE.COOLING]: ATA_OPERATION_MODE.COOL,
  [AC_MODE.FAN]: ATA_OPERATION_MODE.FAN,
  [AC_MODE.AUTO]: ATA_OPERATION_MODE.AUTOMATIC,
};

/**
 * @description Transform value from a MELCloud Home unit to Gladys.
 * @param {object} deviceFeature - Gladys device feature.
 * @param {object} unit - MELCloud Home air-to-air unit.
 * @returns {number} Value.
 * @example
 * transformValueFromMELCloud(deviceFeature, unit);
 */
function transformValueFromMELCloud(deviceFeature, unit) {
  const [, , code] = deviceFeature.external_id.split(':');

  switch (code) {
    case 'power':
      return getSetting(unit, 'Power') === 'True' ? 1 : 0;
    case 'mode': {
      const mode = modesMELCloudToGladys[getSetting(unit, 'OperationMode')];
      return mode === undefined ? null : mode;
    }
    case 'temperature':
      return toNumber(getSetting(unit, 'SetTemperature'));
    case 'room-temperature':
      return toNumber(getSetting(unit, 'RoomTemperature'));
    default:
      return null;
  }
}

/**
 * @description Build the full command payload from a unit's current state.
 * The MELCloud Home API expects a full object; sending only the changed field
 * would reset the others, so we start from the current state and overlay changes.
 * @param {object} unit - MELCloud Home air-to-air unit.
 * @returns {object} Full command payload.
 * @example
 * buildFullPayload(unit);
 */
function buildFullPayload(unit) {
  return {
    power: getSetting(unit, 'Power') === 'True',
    operationMode: getSetting(unit, 'OperationMode'),
    setTemperature: toNumber(getSetting(unit, 'SetTemperature')),
    setFanSpeed: getSetting(unit, 'SetFanSpeed'),
    vaneVerticalDirection: getSetting(unit, 'VaneVerticalDirection'),
    vaneHorizontalDirection: getSetting(unit, 'VaneHorizontalDirection'),
    temperatureIncrementOverride: null,
    inStandbyMode: getSetting(unit, 'InStandbyMode') === 'True',
  };
}

/**
 * @description Transform value from Gladys to a partial MELCloud Home command payload.
 * @param {object} deviceFeature - Gladys device feature.
 * @param {number} value - Gladys value.
 * @returns {object} Partial command payload to overlay on the full payload.
 * @example
 * transformValueFromGladys(deviceFeature, value);
 */
function transformValueFromGladys(deviceFeature, value) {
  const [, , code] = deviceFeature.external_id.split(':');

  switch (code) {
    case 'power':
      return { power: value === 1 };
    case 'mode':
      return { operationMode: modesGladysToMELCloud[value] };
    case 'temperature':
      return { setTemperature: value };
    default:
      return null;
  }
}

module.exports = {
  getSetting,
  getGladysDeviceFeatures,
  buildFullPayload,
  transformValueFromMELCloud,
  transformValueFromGladys,
};
