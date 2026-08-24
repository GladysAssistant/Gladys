const { DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

/**
 * @see https://developers.google.com/assistant/smarthome/guides/sensor
 */
const humiditySensorType = {
  key: 'action.devices.types.SENSOR',
  category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
};

module.exports = {
  humiditySensorType,
};
