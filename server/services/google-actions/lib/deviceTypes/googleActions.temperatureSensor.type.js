const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

/**
 * @see https://developers.google.com/assistant/smarthome/guides/sensor
 */
const temperatureSensorType = {
  key: 'action.devices.types.SENSOR',
  category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
};

module.exports = {
  temperatureSensorType,
};
