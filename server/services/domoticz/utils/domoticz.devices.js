// From page https://www.domoticz.com/wiki/Domoticz_API/JSON_URL
// Extract type of device and features from JSON data
const { slugify } = require('../../../utils/slugify');
const { DEVICE_FEATURE_UNITS, DEVICE_POLL_FREQUENCIES } = require('../../../utils/constants');
const { DOMOTICZ_UNITS, DOMOTICZ_FEATURES } = require('./domoticz.constants');
const logger = require('../../../utils/logger');

/**
 * @description Get battery feature and adds it to the device.
 * @param {Object} data - JSON data from Domoticz.
 * @param {Object} device - Device to poll.
 * @example
 * getBatteryFeature(device, data);
 */
function getBatteryFeature(data, device) {
  if ('BatteryLevel' in data && data.BatteryLevel !== 255) {
    const { category, type, min, max } = DOMOTICZ_FEATURES.battery;
    const selector = slugify(`domoticz-battery-${data.Name}-${data.idx}`);
    device.features.push({
      name: data.Name,
      selector,
      category,
      type,
      external_id: selector,
      read_only: true,
      unit: DEVICE_FEATURE_UNITS.PERCENT,
      has_feedback: false,
      keep_history: true,
      min,
      max,
      last_value: data.BatteryLevel,
      last_value_changed: data.LastUpdate,
    });
  }
}

/**
 * @description Get battery value with date.
 * @param {Object} data - JSON data from Domoticz.
 * @returns {Object|null} Battery state update.
 * @example
 * getBatteryValue(data);
 */
function getBatteryValue(data) {
  if ('BatteryLevel' in data && data.BatteryLevel !== 255) {
    const selector = slugify(`domoticz-battery-${data.Name}-${data.idx}`);
    return {
      device_feature_external_id: selector,
      state: data.BatteryLevel,
    };
  }
  return null;
}

/**
 * @description Get device features for temperature sensors (With potential humidity and barometer).
 * @param {string} serviceId - Service ID.
 * @param {Object} data - JSON data from Domoticz.
 * @returns {Object} Device.
 * @example
 * getTempSensor('id', data);
 */
function getTempSensor(serviceId, data) {
  const selector = slugify(`domoticz-${data.Name}-${data.idx}`);
  const newDevice = {
    name: data.Name,
    service_id: serviceId,
    selector,
    model: `${data.HardwareName}:${data.SubType}`,
    external_id: `domoticz:${data.idx}`,
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_MINUTES,
    features: [],
    params: [],
  };

  const features = data.Type.split(' + ');
  const values = data.Data.split(', ');

  features
    .map((feature, i) => [feature, values[i]])
    .forEach(([feature, val]) => {
      const [value, u] = val.split(' ');
      const unit = DOMOTICZ_UNITS[u];
      const { category, type, min, max } = DOMOTICZ_FEATURES[feature.toLowerCase()];
      const featureSelector = slugify(`domoticz-${feature}-${data.Name}-${data.idx}`);
      newDevice.features.push({
        name: data.Name,
        selector: featureSelector,
        category,
        type,
        external_id: featureSelector,
        read_only: true,
        unit,
        has_feedback: false,
        keep_history: true,
        min,
        max,
        last_value: value,
        last_value_changed: data.LastUpdate,
      });
    });
  getBatteryFeature(data, newDevice);

  return newDevice;
}

/**
 * @description Get device values for temperature sensors (With potential humidity and barometer).
 * @param {Object} data - JSON data from Domoticz.
 * @returns {Array} List of state updates.
 * @example
 * getTempValues(data);
 */
function getTempValues(data) {
  const features = data.Type.split(' + ');
  const values = data.Data.split(', ');

  const featureValues = [];
  features
    .map((feature, i) => [feature, values[i]])
    .forEach(([feature, val]) => {
      const value = val.split(' ')[0];
      const featureSelector = slugify(`domoticz-${feature}-${data.Name}-${data.idx}`);
      featureValues.push({
        device_feature_external_id: featureSelector,
        state: value,
      });
    });

  const batteryValue = getBatteryValue(data);
  if (batteryValue !== null) {
    featureValues.push(batteryValue);
  }

  return featureValues;
}

// Type to function map
const GET_DEVICE_MAP = {
  Temp: {
    device: getTempSensor,
    value: getTempValues,
  },
  'Temp + Humidity': {
    device: getTempSensor,
    value: getTempValues,
  },
  'Temp + Humidity + Baro': {
    device: getTempSensor,
    value: getTempValues,
  },
};

/**
 * @description Get list of devices depending on type.
 * @param {string} serviceId - Service ID.
 * @param {Object} data - JSON data from Domoticz.
 * @returns {Array} List of devices in Gladys format.
 * @example
 * parseDevices('my_id', {});
 */
function parseDevices(serviceId, data) {
  const devices = [];
  data.forEach((device) => {
    const funcs = GET_DEVICE_MAP[device.Type];
    if (funcs === undefined) {
      logger.info(
        `Device ${device.Name} found but type ${device.Type} is not known in domoticz/utils/getDeviceFeatures.js`,
      );
    } else {
      const func = funcs.device;
      devices.push(func(serviceId, device));
    }
  });
  return devices;
}

/**
 * @description Get values for a device if value has been updated, an empty map otherwise.
 * @param {Object} device - Device to get value for.
 * @param {Object} data - JSON data from Domoticz.
 * @returns {Array} List of feature states.
 * @example
 * parseValues({}, {});
 */
function parseValues(device, data) {
  const funcs = GET_DEVICE_MAP[data.Type];
  if (funcs === undefined) {
    logger.error(`Reading value for device ${device.Name} but type ${data.Type} is not known`);
  } else {
    const func = funcs.value;
    if (device.last_value_changed < data.LastUpdate) {
      return func(data);
    }
  }
  return [];
}

module.exports = {
  parseDevices,
  parseValues,
};
