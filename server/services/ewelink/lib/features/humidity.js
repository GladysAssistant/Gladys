const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { parseExternalId } = require('../utils/externalId');

module.exports = {
  // Gladys feature
  generateFeature: (name, channel = 0) => {
    return {
      name: `${name} Humidity`,
      category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
      type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      read_only: true,
      has_feedback: false,
      min: 0,
      max: 100,
      unit: DEVICE_FEATURE_UNITS.PERCENT,
    };
  },
  pollHumidity: (eWeLinkDevice, feature) => {
    const { deviceId } = parseExternalId(feature.external_id);
    const currentHumidity = (eWeLinkDevice.params && eWeLinkDevice.params.currentHumidity) || false;
    // if the value is different from the value we have, save new state
    if (currentHumidity && feature.last_value !== currentHumidity) {
      logger.debug(`eWeLink: Polling device "${deviceId}", humidity new value = ${currentHumidity}`);
      return currentHumidity;
    }
    return null;
  },
};
